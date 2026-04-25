# 🍬 CandyNest — Premium Family Hub

Aplikasi manajemen keluarga modern dan *premium* yang dirancang untuk membantu keluarga mengelola **keuangan, dokumen penting (OCR), dan anggaran** dalam satu tempat yang aman dan sinkron secara *real-time*.

![CandyNest Logo](/public/logo.png)

## ✨ Fitur Unggulan (Premium Experience)

- 💰 **Dashboard Keuangan Visioner** — Tampilan kartu saldo dengan gaya *Glassmorphism* yang elegan, grafik tren 7-hari yang interaktif, dan kalkulasi akumulasi tabungan seluruh waktu.
- 📂 **Brankas Dokumen (Smart OCR)** — Simpan KTP, KK, Akta, dan dokumen penting lainnya. Dilengkapi teknologi **OCR (Optical Character Recognition)** untuk ekstrak data teks secara otomatis dari foto.
- 💑 **Sinkronisasi Pasangan (Couple Sync)** — Hubungkan akun dengan pasangan menggunakan *kode undangan*. Semua data (transaksi & dokumen) sinkron otomatis secara *real-time* di kedua perangkat.
- 📊 **Smart Budgeting** — Atur batas pengeluaran bulanan per kategori. Indikator visual dinamis akan memperingatkan jika kamu sudah mendekati atau melewati batas anggaran.
- 📱 **Native-Feel Navigation** — Navigasi cerdas yang beradaptasi: **Dark Sidebar** yang profesional untuk desktop, dan **Premium Bottom Bar** yang ergonomis untuk pengalaman mobile terbaik.
- ⚡ **Instalasi PWA** — Dapat di-install langsung ke layar utama (Home Screen) Android maupun iOS seperti aplikasi native dari App Store.

---

## 🛠️ Tech Stack & Arsitektur Modern

CandyNest dibangun menggunakan teknologi mutakhir untuk memastikan kecepatan dan keamanan data:

- **Core**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (High-performance global state)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom Design System, Glassmorphism, Responsive)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Smooth springs & transitions)
- **Backend**: [Firebase](https://firebase.google.com/) (Auth, Cloud Firestore Real-time, Storage)
- **AI/OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (Client-side Document Scanning)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Memulai (Local Development)

### 1. Persiapan Environment
Duplikat file `.env.example` menjadi `.env` dan isi dengan kredensial Firebase Anda:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Instalasi & Menjalankan Proyek
Proyek ini menggunakan **npm** (atau yarn/pnpm).
```bash
# Install dependencies
npm install

# Jalankan server development
npm run dev
```
Aplikasi akan berjalan di [http://localhost:5173](http://localhost:5173).

---

## 📁 Struktur Folder Utama

```text
src/
├── components/     # Komponen UI Reusable (Modal, Layout, Navigasi)
├── store/          # Zustand Stores (Auth, Confirmation State)
├── hooks/          # Custom Hooks (Transactions, Documents, Budget Logic)
├── pages/          # Halaman Aplikasi (Dashboard, Transactions, Docs, Settings)
├── types/          # Type Definitions untuk Document & Financial Data
├── utils/          # Helper (OCR Parsing, Image Compression, Formatting)
└── firebase.ts      # Konfigurasi Firebase SDK
```

---

## 🔒 Keamanan Data & Privasi

CandyNest menerapkan aturan keamanan **Firestore Security Rules** yang ketat:
- Data transaksi dan dokumen hanya bisa diakses oleh user yang terverifikasi dan terhubung dalam satu `coupleId`.
- Proses pengunggahan dokumen ke **Firebase Storage** diproteksi dengan path folder unik per pasangan.
- Teknologi OCR berjalan sepenuhnya di sisi *client* (browser user) untuk menjaga privasi data sensitif sebelum disimpan.

---

## 📱 Alur Menghubungkan Pasangan

1. **Daftar**: Suami dan Istri membuat akun masing-masing.
2. **Kirim Kode**: Salah satu pihak pergi ke menu **Pengaturan**, lalu salin **Kode Undangan**.
3. **Konfirmasi**: Pihak lain memasukkan kode tersebut di menu Pengaturan HP-nya, lalu klik **Hubungkan**.
4. **Selesai**: Data finansial dan brankas dokumen akan langsung tersinkronisasi di kedua HP secara ajaib. ✨

---

Dibuat dengan ❤️ oleh Keluarga untuk Keluarga.
**CandyNest — Sweetening Your Family's Financial Future.**
