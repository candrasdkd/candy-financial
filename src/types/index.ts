export type TransactionType = 'income' | 'expense';

export type Category =
  | 'gaji'
  | 'freelance'
  | 'investasi'
  | 'bisnis'
  | 'lainnya_pemasukan'
  | 'makan'
  | 'transport'
  | 'belanja'
  | 'tagihan'
  | 'kesehatan'
  | 'hiburan'
  | 'pendidikan'
  | 'tabungan'
  | 'lainnya_pengeluaran';

export interface Transaction {
  id: string;
  userId: string;
  coupleId: string;
  type: TransactionType;
  category: Category;
  amount: number;
  description: string;
  date: string; // ISO string
  createdAt: string;
  addedBy: string; // user displayName
}

export interface Budget {
  id: string;
  coupleId: string;
  category: Category;
  limit: number;
  month: string; // YYYY-MM
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  coupleId: string | null;
  partnerEmail: string | null;
  inviteCode: string;
}

export interface CoupleData {
  id: string;
  members: string[]; // array of UIDs
  createdAt: string;
}

export const INCOME_CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'gaji', label: 'Gaji', emoji: '💼' },
  { value: 'freelance', label: 'Freelance', emoji: '💻' },
  { value: 'investasi', label: 'Investasi', emoji: '📈' },
  { value: 'bisnis', label: 'Bisnis', emoji: '🏪' },
  { value: 'lainnya_pemasukan', label: 'Lainnya', emoji: '💰' },
];

export const EXPENSE_CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'makan', label: 'Makan & Minum', emoji: '🍜' },
  { value: 'transport', label: 'Transportasi', emoji: '🚗' },
  { value: 'belanja', label: 'Belanja', emoji: '🛍️' },
  { value: 'tagihan', label: 'Tagihan', emoji: '📄' },
  { value: 'kesehatan', label: 'Kesehatan', emoji: '🏥' },
  { value: 'hiburan', label: 'Hiburan', emoji: '🎬' },
  { value: 'pendidikan', label: 'Pendidikan', emoji: '📚' },
  { value: 'tabungan', label: 'Tabungan', emoji: '🏦' },
  { value: 'lainnya_pengeluaran', label: 'Lainnya', emoji: '💸' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryInfo(cat: Category) {
  return ALL_CATEGORIES.find(c => c.value === cat) || { value: cat, label: cat, emoji: '📌' };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
