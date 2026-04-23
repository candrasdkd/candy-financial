export type TransactionType = 'income' | 'expense';
import {
  Briefcase,
  Laptop,
  TrendingUp,
  Store,
  Coins,
  Utensils,
  Car,
  ShoppingBag,
  FileText,
  Activity,
  Film,
  Book,
  Landmark,
  Banknote,
  Tag
} from 'lucide-react';

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
  partnerName: string | null;
  inviteCode: string;
}

export interface CoupleData {
  id: string;
  members: string[]; // array of UIDs
  createdAt: string;
}

export const INCOME_CATEGORIES: { value: Category; label: string; icon: any }[] = [
  { value: 'gaji', label: 'Gaji', icon: Briefcase },
  { value: 'freelance', label: 'Freelance', icon: Laptop },
  { value: 'investasi', label: 'Investasi', icon: TrendingUp },
  { value: 'bisnis', label: 'Bisnis', icon: Store },
  { value: 'lainnya_pemasukan', label: 'Lainnya', icon: Coins },
];

export const EXPENSE_CATEGORIES: { value: Category; label: string; icon: any }[] = [
  { value: 'makan', label: 'Makan & Minum', icon: Utensils },
  { value: 'transport', label: 'Transportasi', icon: Car },
  { value: 'belanja', label: 'Belanja', icon: ShoppingBag },
  { value: 'tagihan', label: 'Tagihan', icon: FileText },
  { value: 'kesehatan', label: 'Kesehatan', icon: Activity },
  { value: 'hiburan', label: 'Hiburan', icon: Film },
  { value: 'pendidikan', label: 'Pendidikan', icon: Book },
  { value: 'tabungan', label: 'Tabungan', icon: Landmark },
  { value: 'lainnya_pengeluaran', label: 'Lainnya', icon: Banknote },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryInfo(cat: Category) {
  return ALL_CATEGORIES.find(c => c.value === cat) || { value: cat, label: cat, icon: Tag };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
