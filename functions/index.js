/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// --- KONFIGURASI DARI ENV ---
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const TARGET_NUMBERS = process.env.TARGET_NUMBERS;

// --- JADWAL: SETIAP HARI JAM 20:00 WIB ---
exports.dailyReminderWA = functions.pubsub
    .schedule("0 12,19 * * *")
    .timeZone("Asia/Jakarta")
    .onRun(async (context) => {
    // 1. Ambil tanggal hari ini (format YYYY-MM-DD sesuai zona waktu Jakarta)
      const today = new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Jakarta"});

      // 2. Cek apakah HARI INI sudah ada pengeluaran yang dicatat di DB
      // Karena kita tidak menyimpan detail per couple id di sini,
      // pastikan logika ini mengambil setidaknya 1 transaksi hari ini di seluruh apps.
      // Jika ada yang catat, akan gagal mengirim reminder ke semua.
      // Agar lebih spesifik, sebaiknya kita query per pengguna/couple.
      // Tapi untuk penggunaan pribadi (berdua), ini sudah cukup.
      const txSnapshot = await db.collection("transactions")
          .where("date", "==", today)
          .limit(1)
          .get();

      // Jika hari ini sudah ada catatan pengeluaran, batalkan peringatan
      if (!txSnapshot.empty) {
        console.log("Sudah ada catatan transaksi hari ini. Reminder dibatalkan.");
        return null;
      }

      // 3. Teks Pesan Pengingat
      const message = "Halo! 👋 Jangan lupa catat keuangan kita hari ini di Candy Financial ya! 🍬 Biar nggak kelupaan besok.";

      // 4. Tembak Fonnte API untuk mengirim WA sekaligus
      try {
        const response = await axios.post(
            "https://api.fonnte.com/send",
            {
              target: TARGET_NUMBERS,
              message: message,
              countryCode: "62", // Format bawaan agar otomatis menggunakan kode ID +62
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
              title: "Pengingat Keuangan 🍬",
              body: "Halo! Jangan lupa catat transaksi hari ini ya agar keuangan tetap terpantau rapi.",
            },
          };

          // multicast send
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
