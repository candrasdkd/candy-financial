# 🍬 CandyNest — Premium Family Hub

Aplikasi manajemen keluarga modern dan *premium* yang dirancang untuk membantu pasangan mengelola **keuangan, catatan penting, dokumen (OCR), dan masa depan finansial** dalam satu ekosistem yang aman dan sinkron secara *real-time*.

![CandyNest Banner](/public/screenshot1.png)

## ✨ Fitur Unggulan (Premium Experience)

### 💰 Dashboard Keuangan Visioner
Tampilan kartu saldo dengan gaya *Glassmorphism* yang elegan. Dilengkapi dengan grafik tren 7-hari yang interaktif dan kalkulasi akumulasi tabungan seluruh waktu secara otomatis.

### 📝 Catatan Pintar (Smart Notes) — *New!*
Bukan sekadar catatan biasa. Sistem cerdas kami mengenali apa yang Anda tulis:
- 🔒 **Auto-Sensor**: Otomatis menyensor kata sandi/PIN jika Anda menggunakan format `Label: Nilai`.
- ✅ **Checklist Interaktif**: Buat daftar belanja atau tugas dengan tanda `> ` yang bisa langsung dicentang.
- 📸 **Multi-Image Attachment**: Lampirkan hingga 4 foto per catatan dengan teknologi kompresi cerdas (Hemat, Standar, Tajam).
- 📲 **Export to WhatsApp**: Kirim isi catatan langsung ke WhatsApp pasangan dengan satu klik.

### 🏺 Pos Tabungan (Envelope Budgeting)
Kelola target masa depan dengan sistem pos (envelopes):
- **Alokasi Gaji**: Wizard cerdas untuk membagi pendapatan ke berbagai pos sekaligus.
- **Target Progress**: Pantau persentase pencapaian target tabungan dengan indikator visual yang cantik.
- **Riwayat Mutasi**: Setiap uang masuk dan keluar dicatat dengan detail siapa yang melakukan perubahan.

### 📂 Brankas Dokumen (Smart OCR)
Simpan KTP, KK, Akta, dan dokumen penting lainnya di satu tempat aman. Dilengkapi teknologi **OCR (Optical Character Recognition)** untuk ekstrak data teks secara otomatis dari foto dokumen Anda.

### 💑 Sinkronisasi Pasangan (Couple Sync)
Hubungkan akun dengan pasangan menggunakan *kode undangan unik*. Semua data (transaksi, catatan, & dokumen) akan tersinkronisasi secara otomatis di kedua perangkat tanpa jeda.

### 📊 Smart Budgeting
Atur batas pengeluaran bulanan per kategori. Indikator visual dinamis akan memberikan peringatan jika pengeluaran Anda sudah mendekati atau melewati batas anggaran yang ditentukan.

### 📢 Laporan Kolaboratif
Bagikan ringkasan keuangan bulanan langsung ke WhatsApp pasangan atau simpan sebagai laporan dengan fitur *Native Share* yang rapi dan informatif.

### 🔔 Reminder Ganda (WA & Web Push)
Pengingat otomatis yang dikirimkan setiap jam **12:00 & 19:00** jika belum ada catatan transaksi hari ini. Notifikasi dikirim melalui WhatsApp (Fonnte API) dan Web Push secara bersamaan.

---

## 🎨 Estetika & User Experience
CandyNest dirancang dengan standar desain tinggi:
- **High-End Animations**: Menggunakan *spring-based animations* dari Framer Motion untuk transisi yang halus dan organik.
- **SaaS-Style UI**: Background dinamis, grid berpola modern, dan elemen transparan yang memberikan kesan eksklusif.
- **Mobile First & PWA**: Navigasi *Bottom Bar* yang ergonomis untuk mobile dan *Dark Sidebar* profesional untuk desktop.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Design Tokens)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Backend**: [Firebase](https://firebase.google.com/) (Firestore Real-time, Auth, Storage, Cloud Functions)
- **OCR Engine**: [Google Cloud Vision API](https://cloud.google.com/vision)
- **WhatsApp Gateway**: [Fonnte API](https://fonnte.com/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Memulai (Local Development)

### 1. Konfigurasi Environment
Salin `.env.example` menjadi `.env` dan isi dengan kredensial Firebase Anda:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

### 2. Instalasi
```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

### 3. Backend (Functions)
```bash
cd functions
npm install
# Konfigurasi FONNTE_TOKEN di environment Firebase
firebase functions:config:set fonnte.token="YOUR_TOKEN"
```

---

## 📁 Struktur Folder

```text
├── src/
│   ├── components/     # UI Components (Modals, Cards, Layouts)
│   ├── store/          # Zustand State (Auth, Trans, Savings, Notes)
│   ├── hooks/          # Business Logic & Data Fetching
│   ├── pages/          # Full Page Views (Dashboard, Notes, Pots, etc.)
│   ├── types/          # TypeScript Interfaces & Constants
│   ├── utils/          # Helpers (OCR, Formatting, Image Comp)
│   └── sw.ts           # PWA & Push Notification Logic
├── functions/          # Scheduled Tasks & WhatsApp Reminder
└── public/             # Static Assets & PWA Icons
```

---

## 🔒 Keamanan Data & Privasi
Keamanan data keluarga Anda adalah prioritas utama kami:
- **Firestore Security Rules**: Data hanya dapat diakses oleh user yang terverifikasi dan memiliki `coupleId` yang sama.
- **Private Storage**: Dokumen diunggah ke Firebase Storage dengan path folder unik dan terproteksi per pasangan.
- **Client-Side Processing**: Teknologi OCR dan kompresi gambar berjalan sepenuhnya di perangkat Anda untuk menjaga privasi sebelum data disimpan.

---

## 📱 Alur Menghubungkan Pasangan
1. **Daftar**: Suami dan Istri membuat akun masing-masing.
2. **Kirim Kode**: Salah satu pihak membuka menu **Pengaturan** dan menyalin **Kode Undangan**.
3. **Hubungkan**: Pihak lain memasukkan kode tersebut di menu Pengaturan akunnya, lalu klik **Hubungkan**.
4. **Selesai**: Data finansial, catatan, dan brankas dokumen akan langsung tersinkronisasi secara ajaib. ✨

---

Dibuat dengan ❤️ untuk membantu keluarga Indonesia lebih melek finansial.
**CandyNest — Sweetening Your Family's Financial Future.**
