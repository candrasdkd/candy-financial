const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const vision = require("@google-cloud/vision");

admin.initializeApp();
const db = admin.firestore();
const visionClient = new vision.ImageAnnotatorClient();

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const TARGET_NUMBERS = process.env.TARGET_NUMBERS;

const MONTHLY_SCAN_LIMIT = 950;

// --- JADWAL: JAM 12:00 dan 19:00 WIB ---
exports.dailyReminderWA = functions.pubsub
    .schedule("0 12,19 * * *")
    .timeZone("Asia/Jakarta")
    .onRun(async (context) => {
      const today = new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Jakarta"});

      const txSnapshot = await db.collection("transactions")
          .where("date", "==", today)
          .limit(1)
          .get();

      if (!txSnapshot.empty) {
        console.log("Sudah ada catatan transaksi hari ini. Reminder dibatalkan.");
        return null;
      }

      const jakartaHour = parseInt(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "numeric",
        hour12: false,
      }));

      let message = "";
      let pushTitle = "";

      if (jakartaHour <= 15) {
        message = "Halo! 👋 Jajan apa hari ini? Jangan lupa catat pengeluaranmu di Candy Financial ya, biar tabungan kamu tetap manis! 🍬";
        pushTitle = "Waktunya Jajan? 🍬";
      } else {
        message = "Sudah mau istirahat? Yuk, luangkan waktu 1 menit buat rekap keuangan hari ini di Candy Financial. Biar besok bangun dengan tenang! 🍭";
        pushTitle = "Rekap Hari Ini 🍭";
      }

      try {
        await axios.post(
            "https://api.fonnte.com/send",
            {
              target: TARGET_NUMBERS,
              message: message,
              countryCode: "62",
            },
            {
              headers: {
                Authorization: FONNTE_TOKEN,
              },
            },
        );
      } catch (error) {
        console.error("[GAGAL] Tidak bisa mengirim WA via Fonnte:", error.message);
      }

      try {
        const usersSnapshot = await db.collection("users").get();
        const allTokens = [];

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
            allTokens.push(...userData.fcmTokens);
          }
        });

        if (allTokens.length > 0) {
          const uniqueTokens = [...new Set(allTokens)];

          const batchResult = await admin.messaging().sendEachForMulticast({
            tokens: uniqueTokens,
            notification: {
              title: pushTitle,
              body: message,
            },
            android: {
              notification: {
                sound: "default",
                priority: "high",
              },
            },
            apns: {
              payload: {
                aps: {sound: "default"},
              },
            },
          });

          // Cleanup stale tokens
          const invalidTokens = [];
          batchResult.responses.forEach((resp, idx) => {
            if (!resp.success &&
            (resp.error?.code === "messaging/registration-token-not-registered" ||
              resp.error?.code === "messaging/invalid-registration-token")) {
              invalidTokens.push(uniqueTokens[idx]);
            }
          });

          // Reuse usersSnapshot — tidak perlu fetch ulang
          if (invalidTokens.length > 0) {
            const batch = db.batch();
            usersSnapshot.forEach((doc) => {
              const tokens = doc.data().fcmTokens || [];
              const cleaned = tokens.filter((t) => !invalidTokens.includes(t));
              if (cleaned.length !== tokens.length) {
                batch.update(doc.ref, {fcmTokens: cleaned});
              }
            });
            await batch.commit();
            console.log(`[INFO] Cleaned ${invalidTokens.length} stale FCM token(s).`);
          }
        }
      } catch (error) {
        console.error("[GAGAL] Tidak bisa mengirim FCM:", error.message);
      }

      return null;
    });

// --- FUNGSI OCR: GOOGLE CLOUD VISION DENGAN LIMITER ---
exports.processOCR = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login dulu ya!");
  }

  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  const coupleId = userDoc.data()?.coupleId || "standalone_" + context.auth.uid;
  const currentMonth = new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Jakarta"}).slice(0, 7);

  const usageRef = db.collection("usage_stats").doc(`${coupleId}_${currentMonth}`);

  const usageDoc = await usageRef.get();
  const currentCount = usageDoc.exists ? usageDoc.data().scanCount : 0;

  if (currentCount >= MONTHLY_SCAN_LIMIT) {
    throw new functions.https.HttpsError(
        "resource-exhausted",
        "Waduh! Jatah scan gratis bulan ini sudah habis (Limit 950). Coba lagi bulan depan ya! 🍬",
    );
  }

  const {imageBase64} = data;
  if (!imageBase64) {
    throw new functions.https.HttpsError("invalid-argument", "Gambar wajib ada.");
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const [result] = await visionClient.textDetection(buffer);
    const detections = result.textAnnotations;

    await usageRef.set({
      scanCount: admin.firestore.FieldValue.increment(1),
      lastScan: admin.firestore.FieldValue.serverTimestamp(),
      coupleId: coupleId,
      month: currentMonth,
    }, {merge: true});

    if (!detections || detections.length === 0) {
      return {text: ""};
    }

    return {text: detections[0].description};
  } catch (error) {
    console.error("OCR Error:", error);
    throw new functions.https.HttpsError("internal", "Gagal memproses gambar: " + error.message);
  }
});
