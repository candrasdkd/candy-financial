const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Ambil config dari environment variables Firebase
// Jalankan ini di terminal untuk set:
// firebase functions:config:set fonnte.token="TOKEN_ANDA" fonnte.targets="628xxx,628xxx"
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const TARGET_NUMBERS = process.env.TARGET_NUMBERS;

// --- JADWAL: JAM 12:00 dan 19:00 WIB ---
exports.dailyReminderWA = functions.pubsub
    .schedule("0 12,19 * * *")
    .timeZone("Asia/Jakarta")
    .onRun(async (context) => {
    // 1. Ambil tanggal hari ini (format YYYY-MM-DD sesuai zona waktu Jakarta)
      const today = new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Jakarta"});

      // 2. Cek apakah HARI INI sudah ada pengeluaran yang dicatat di DB
      const txSnapshot = await db.collection("transactions")
          .where("date", "==", today)
          .limit(1)
          .get();

      // Jika hari ini sudah ada catatan pengeluaran, batalkan peringatan
      if (!txSnapshot.empty) {
        console.log("Sudah ada catatan transaksi hari ini. Reminder dibatalkan.");
        return null;
      }

      // 3. Tentukan pesan berdasarkan jam (Siang atau Malam)
      const jakartaHour = parseInt(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "numeric",
        hour12: false,
      }));

      let message = "";
      let pushTitle = "";

      if (jakartaHour <= 15) {
      // Opsi Siang
        message = "Halo! 👋 Jajan apa hari ini? Jangan lupa catat pengeluaranmu di Candy Financial ya, biar tabungan kamu tetap manis! 🍬";
        pushTitle = "Waktunya Jajan? 🍬";
      } else {
      // Opsi Malam
        message = "Sudah mau istirahat? Yuk, luangkan waktu 1 menit buat rekap keuangan hari ini di Candy Financial. Biar besok bangun dengan tenang! 🍭";
        pushTitle = "Rekap Hari Ini 🍭";
      }

      // 4. Tembak Fonnte API untuk mengirim WA sekaligus
      try {
        const response = await axios.post(
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

        console.log("[SUKSES] Pesan WA terkirim. Respon Fonnte:", response.data);
      } catch (error) {
        console.error("[GAGAL] Tidak bisa mengirim WA via Fonnte:", error.response?.data || error.message);
      }

      // 5. Kirim Web Push Notification via FCM
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
          const uniqueTokens = [...new Set(allTokens)]; // Remove duplicates
          const payload = {
            notification: {
              title: pushTitle,
              body: message,
            },
          };

          const multicastPayload = {
            tokens: uniqueTokens,
            ...payload,
          };

          const fcmResponse = await admin.messaging().sendEachForMulticast(multicastPayload);
          console.log(`[SUKSES] FCM dikirim: ${fcmResponse.successCount} berhasil, ${fcmResponse.failureCount} gagal.`);
        } else {
          console.log("Tidak ada FCM Token yang ditemukan.");
        }
      } catch (error) {
        console.error("[GAGAL] Tidak bisa mengirim FCM:", error.message);
      }

      return null;
    });
