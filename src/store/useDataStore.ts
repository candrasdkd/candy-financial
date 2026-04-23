import { create } from 'zustand';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Budget } from '../types';
import { useAuthStore } from './useAuthStore';

interface DataState {
  transactions: Transaction[];
  budgets: Budget[];
  txLoading: boolean;
  budgetLoading: boolean;
  txError: string | null;
  budgetError: string | null;

  // Listeners
  initTransactions: () => () => void;
  initBudgets: () => () => void;
  clearData: () => void;

  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'coupleId' | 'userId' | 'createdAt' | 'addedBy'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setBudget: (category: string, limit: number, month: string) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  transactions: [],
  budgets: [],
  txLoading: true,
  budgetLoading: true,
  txError: null,
  budgetError: null,

  initTransactions: () => {
    const { transactions, txLoading } = get();
    const userProfile = useAuthStore.getState().userProfile;
    
    if (!userProfile?.coupleId) {
      if (transactions.length > 0 || txLoading) {
        set({ transactions: [], txLoading: false });
      }
      return () => {};
    }

    const q = query(
      collection(db, 'transactions'),
      where('coupleId', '==', userProfile.coupleId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Transaction))
          .sort((a, b) => b.date.localeCompare(a.date));
        set({ transactions: data, txLoading: false, txError: null });
      },
      (err) => {
        set({ txError: err.message, txLoading: false });
      }
    );

    return unsub;
  },

  initBudgets: () => {
    const { budgets, budgetLoading } = get();
    const userProfile = useAuthStore.getState().userProfile;
    
    if (!userProfile?.coupleId) {
      if (budgets.length > 0 || budgetLoading) {
        set({ budgets: [], budgetLoading: false });
      }
      return () => {};
    }

    const q = query(
      collection(db, 'budgets'),
      where('coupleId', '==', userProfile.coupleId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
        set({ budgets: data, budgetLoading: false, budgetError: null });
      },
      (err) => {
        set({ budgetError: err.message, budgetLoading: false });
      }
    );

    return unsub;
  },

  addTransaction: async (data) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');
    
    await addDoc(collection(db, 'transactions'), {
      ...data,
      userId: userProfile.uid,
      coupleId: userProfile.coupleId,
      addedBy: userProfile.displayName,
      createdAt: new Date().toISOString(),
    });
  },

  deleteTransaction: async (id) => {
    await deleteDoc(doc(db, 'transactions', id));
  },

  setBudget: async (category, limit, month) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');
    
    const { budgets } = get();
    const existing = budgets.find(b => b.category === category && b.month === month);
    
    if (existing) {
      await updateDoc(doc(db, 'budgets', existing.id), { limit });
    } else {
      await addDoc(collection(db, 'budgets'), {
        coupleId: userProfile.coupleId,
        category,
        limit,
        month,
      });
    }
  },

  deleteBudget: async (id) => {
    await deleteDoc(doc(db, 'budgets', id));
  },

  clearData: () => {
    set({
      transactions: [],
      budgets: [],
      txLoading: true,
      budgetLoading: true,
      txError: null,
      budgetError: null
    });
  }
}));
