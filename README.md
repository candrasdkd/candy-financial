# 🍬 CandyNest — Family Management App

Aplikasi manajemen keluarga modern dan *premium* yang dirancang untuk membantu keluarga mengelola **keuangan, dokumen, dan kebutuhan rumah tangga** dalam satu tempat. Dibangun dengan React (TypeScript), Vite, Tailwind CSS, dan Firebase.

## ✨ Fitur Utama

- 🔐 **Autentikasi & Akun** — Daftar & login aman dengan email/password.
- 💑 **Sinkronisasi Pasangan** — Hubungkan akun dengan pasangan menggunakan *kode undangan*. Transaksi otomatis sinkron *real-time*.
- 💰 **Pencatatan Transaksi** — Catat pemasukan dan pengeluaran dengan kategori ber-emoji. Dilengkapi identifikasi **"SAYA"** atau **"PASANGAN"** untuk melihat siapa yang mencatat.
- 📊 **Dashboard Premium** — Tampilan kartu saldo modern ber-*gradient*, grafik Area Chart 7-hari interaktif, dan Pie Chart pengeluaran menggunakan Recharts dengan Custom Tooltips.
- 📅 **Riwayat (Date Range Filter)** — Telusuri transaksi menggunakan rentang tanggal (*Date Range*) yang fleksibel dan fitur pencarian.
- 🏦 **Anggaran (Budgeting)** — Atur batas pengeluaran bulanan per kategori. Terdapat *progress bar* yang berubah warna saat mendekati/melewati batas anggaran.
- 📱 **Progressive Web App (PWA)** — Aplikasi *mobile-friendly* dan bisa langsung di-*install* ke layar utama (Home Screen) Android maupun iOS.

---

## 🚀 Cara Setup (Local Development)

### 1. Install Dependencies
Proyek ini menggunakan Yarn. Jalankan perintah:
```bash
yarn install
```

### 2. Setup Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Buat proyek baru.
3. Aktifkan **Authentication** → Sign-in method → **Email/Password**.
4. Aktifkan **Firestore Database**.

### 3. Konfigurasi Environment
Duplikat file konfigurasi *environment*:
```bash
cp .env.example .env
```
Lalu lengkapi file `.env` dengan kredensial Firebase milikmu:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project-name.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-name
VITE_FIREBASE_STORAGE_BUCKET=project-name.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Firestore Security Rules
Di Firebase Console → Firestore → Rules, ganti dan simpan *rules* berikut agar data aman dari kebocoran (*Data Privacy Protected*):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fungsi bantuan untuk mengambil coupleId dari user yang sedang request
    function getUserCoupleId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId;
    }

    // Profil user
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Izin khusus untuk proses pairing pasangan
      allow update: if request.auth != null
        && resource.data.coupleId == null
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['coupleId', 'partnerEmail']);
    }

    // Pasangan (Couples)
    match /couples/{coupleId} {
      allow read, update: if request.auth != null && request.auth.uid in resource.data.users;
      allow create: if request.auth != null;
    }

    // Transaksi hanya untuk anggota pasangan tersebut
    match /transactions/{txId} {
      allow read, update, delete: if request.auth != null && resource.data.coupleId == getUserCoupleId();
      allow create: if request.auth != null && request.resource.data.coupleId == getUserCoupleId();
    }

    // Budgeting sama dengan transaksi
    match /budgets/{budgetId} {
      allow read, update, delete: if request.auth != null && resource.data.coupleId == getUserCoupleId();
      allow create: if request.auth != null && request.resource.data.coupleId == getUserCoupleId();
    }
  }
}
```

### 5. Jalankan Aplikasi
```bash
yarn dev
```
Buka aplikasi di browser pada [http://localhost:5173](http://localhost:5173).

---

## 📱 Alur Penggunaan (Pasutri)

1. **Daftar**: Suami dan Istri masing-masing membuat akun di perangkat/HP masing-masing.
2. **Koneksi**: Salah satu orang membuka **Pengaturan (Settings)** lalu menyalin **Kode Undangan**.
3. **Hubungkan**: Orang yang satunya membuka menu **Pengaturan**, memasukkan kode tersebut, lalu klik **Hubungkan**.
4. Selesai! Aplikasi langsung tersinkronisasi. Semua transaksi yang dimasukkan satu pihak akan otomatis muncul di HP pasangan.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Desain modern, glassmorphism, responsive)
- **Backend & Database**: Firebase (Auth, Firestore *Realtime*)
- **Grafik & Visualisasi**: Recharts
- **Routing**: React Router DOM v6
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Deployment**: Vercel (Auto-rewrite SPA routing enabled)
- **PWA Strategy**: Vite PWA (AutoUpdate enabled for instant changes)

## 📁 Struktur Proyek Utama

```text
src/
├── components/          # Komponen UI (ConfirmModal, TransactionModal, dll)
├── contexts/            # Context API (AuthContext)
├── hooks/               # Custom Hooks penyederhanaan logika:
│   ├── useTransactions.ts
│   ├── useDashboardStats.ts # Logika kalkulasi Dashboard
│   └── useBudgetStats.ts    # Logika kalkulasi Budgeting
├── pages/               # React Router Pages (Dashboard, Budget, dll)
├── types/               # Type Definition (.d.ts) dan helper fungsi
├── App.tsx              # Root Router
└── index.css            # Setup Tailwind base
```
