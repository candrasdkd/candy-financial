# 💑 DuaHati Finance — Manajemen Keuangan Pasutri

Aplikasi manajemen keuangan untuk pasangan suami istri dengan Firebase, React TypeScript, dan Tailwind CSS.

## ✨ Fitur

- 🔐 **Autentikasi** — Daftar & login dengan email/password
- 💑 **Sistem Pasangan** — Hubungkan akun dengan pasangan via kode undangan
- 💰 **Catat Transaksi** — Pemasukan & pengeluaran dengan 14 kategori
- 📊 **Dashboard** — Ringkasan keuangan bulan ini dengan grafik
- 📋 **Riwayat** — Filter & cari transaksi, dikelompokkan per hari
- 🏦 **Anggaran** — Set batas pengeluaran per kategori dengan indikator
- 📱 **Responsif** — Mobile & desktop friendly

---

## 🚀 Cara Setup

### 1. Install Dependencies

```bash
cd pasutri-finance
npm install
```

### 2. Setup Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Buat project baru
3. Aktifkan **Authentication** → Sign-in method → **Email/Password**
4. Aktifkan **Firestore Database** (mode production atau test)
5. Salin konfigurasi Firebase

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Isi file `.env` dengan konfigurasi Firebase kamu:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project-name.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-name
VITE_FIREBASE_STORAGE_BUCKET=project-name.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Firestore Security Rules

Di Firebase Console → Firestore → Rules, paste rules berikut:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Couples readable/writable by members
    match /couples/{coupleId} {
      allow read, write: if request.auth != null;
    }

    // Transactions: only couple members
    match /transactions/{txId} {
      allow read, write: if request.auth != null &&
        resource == null || resource.data.coupleId != null;
      allow create: if request.auth != null;
    }

    // Budgets: same as transactions
    match /budgets/{budgetId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

---

## 📱 Cara Penggunaan

1. **Daftar** akun untuk kamu dan pasangan (akun terpisah)
2. Salah satu buka **Pengaturan** → salin **Kode Undangan**
3. Yang lain buka **Pengaturan** → masukkan kode tersebut → **Hubungkan**
4. Sekarang kalian bisa mulai mencatat transaksi bersama! 🎉

---

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Firebase** — Auth + Firestore
- **Recharts** — grafik
- **React Router v6** — routing
- **date-fns** — manipulasi tanggal
- **Lucide React** — icons

---

## 📁 Struktur Project

```
src/
├── components/
│   ├── Layout.tsx          # Sidebar + layout wrapper
│   └── TransactionModal.tsx # Modal tambah transaksi
├── contexts/
│   └── AuthContext.tsx     # Auth + user profile state
├── hooks/
│   └── useTransactions.ts  # Transaksi & budget hooks
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Budget.tsx
│   └── Settings.tsx
├── types/
│   └── index.ts            # Type definitions + helpers
├── firebase.ts             # Firebase init
├── App.tsx                 # Routing
└── main.tsx
```
