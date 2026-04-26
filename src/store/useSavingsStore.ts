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
  writeBatch,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SavingsPot, PotTransaction, POT_COLORS, POT_EMOJIS, MAX_POTS } from '../types';
import { useAuthStore } from './useAuthStore';
import { useDataStore } from './useDataStore';

interface SavingsState {
  pots: SavingsPot[];
  potTransactions: PotTransaction[];
  potsLoading: boolean;
  potsError: string | null;

  // Listeners
  initPots: () => () => void;
  clearPots: () => void;

  // Pot CRUD
  addPot: (data: { name: string; emoji: string; color: string; targetAmount?: number }) => Promise<void>;
  updatePot: (id: string, data: Partial<Pick<SavingsPot, 'name' | 'emoji' | 'color' | 'targetAmount'>>) => Promise<void>;
  deletePot: (id: string) => Promise<void>;

  // Money movements
  depositToPot: (potId: string, amount: number, note: string, date: string, mainCategory?: string) => Promise<void>;
  withdrawFromPot: (potId: string, amount: number, note: string, date: string, mainCategory?: string) => Promise<void>;

  // Allocation flow: distribute income to multiple pots at once
  allocateIncome: (allocations: { potId: string; amount: number }[], totalNote: string, date: string) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  pots: [],
  potTransactions: [],
  potsLoading: true,
  potsError: null,

  initPots: () => {
    const userProfile = useAuthStore.getState().userProfile;

    if (!userProfile?.coupleId) {
      set({ pots: [], potTransactions: [], potsLoading: false });
      return () => { };
    }

    const potsQ = query(
      collection(db, 'savingsPots'),
      where('coupleId', '==', userProfile.coupleId),
      orderBy('order', 'asc')
    );

    const txQ = query(
      collection(db, 'potTransactions'),
      where('coupleId', '==', userProfile.coupleId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubPots = onSnapshot(
      potsQ,
      (snap) => {
        const pots = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsPot));
        set({ pots, potsLoading: false, potsError: null });
      },
      (err) => {
        console.error('Savings pots error:', err);
        set({ potsError: 'Gagal memuat pos tabungan.', potsLoading: false });
      }
    );

    const unsubTx = onSnapshot(
      txQ,
      (snap) => {
        const txs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PotTransaction));
        set({ potTransactions: txs });
      },
      (err) => {
        console.error('Pot transactions error:', err);
      }
    );

    return () => {
      unsubPots();
      unsubTx();
    };
  },

  clearPots: () => {
    set({ pots: [], potTransactions: [], potsLoading: true, potsError: null });
  },

  addPot: async ({ name, emoji, color, targetAmount }) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');

    const { pots } = get();
    if (pots.length >= MAX_POTS) throw new Error(`Maksimal ${MAX_POTS} pos tabungan`);

    await addDoc(collection(db, 'savingsPots'), {
      coupleId: userProfile.coupleId,
      name: name.trim(),
      emoji: emoji || POT_EMOJIS[pots.length % POT_EMOJIS.length],
      color: color || POT_COLORS[pots.length % POT_COLORS.length],
      targetAmount: targetAmount || null,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
      order: pots.length,
    });
  },

  updatePot: async (id, data) => {
    await updateDoc(doc(db, 'savingsPots', id), data as any);
  },

  deletePot: async (id) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');

    // Also delete all pot transactions for this pot
    const { potTransactions } = get();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'savingsPots', id));
    potTransactions
      .filter(tx => tx.potId === id)
      .forEach(tx => batch.delete(doc(db, 'potTransactions', tx.id)));

    const mainTxs = useDataStore.getState().transactions.filter(tx => tx.relatedPotId === id);
    mainTxs.forEach(tx => batch.delete(doc(db, 'transactions', tx.id)));

    await batch.commit();
  },

  depositToPot: async (potId, amount, note, date, mainCategory) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');

    const { pots } = get();
    const pot = pots.find(p => p.id === potId);
    if (!pot) throw new Error('Pos tidak ditemukan');

    const batch = writeBatch(db);

    // Create pot transaction record
    const txRef = doc(collection(db, 'potTransactions'));
    batch.set(txRef, {
      potId,
      coupleId: userProfile.coupleId,
      type: 'deposit',
      amount,
      note: note.trim() || 'Deposit',
      date,
      addedBy: userProfile.displayName,
      createdAt: new Date().toISOString(),
    });

    // Create main transaction
    const mainTxRef = doc(collection(db, 'transactions'));
    batch.set(mainTxRef, {
      userId: userProfile.uid,
      coupleId: userProfile.coupleId,
      type: 'income',
      category: mainCategory || 'lainnya_pemasukan',
      amount,
      description: `[Pos ${pot.name}] ${note.trim() || 'Deposit'}`,
      date,
      addedBy: userProfile.displayName,
      createdAt: new Date().toISOString(),
      relatedPotId: potId,
    });

    // Update pot balance
    batch.update(doc(db, 'savingsPots', potId), {
      currentBalance: pot.currentBalance + amount,
    });

    await batch.commit();
  },

  withdrawFromPot: async (potId, amount, note, date, mainCategory) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');

    const { pots } = get();
    const pot = pots.find(p => p.id === potId);
    if (!pot) throw new Error('Pos tidak ditemukan');
    if (amount > pot.currentBalance) throw new Error('Saldo pos tidak cukup');

    const batch = writeBatch(db);

    const txRef = doc(collection(db, 'potTransactions'));
    batch.set(txRef, {
      potId,
      coupleId: userProfile.coupleId,
      type: 'withdraw',
      amount,
      note: note.trim() || 'Penarikan',
      date,
      addedBy: userProfile.displayName,
      createdAt: new Date().toISOString(),
    });

    // Create main transaction
    const mainTxRef = doc(collection(db, 'transactions'));
    batch.set(mainTxRef, {
      userId: userProfile.uid,
      coupleId: userProfile.coupleId,
      type: 'expense',
      category: mainCategory || 'lainnya_pengeluaran',
      amount,
      description: `[Pos ${pot.name}] ${note.trim() || 'Penarikan'}`,
      date,
      addedBy: userProfile.displayName,
      createdAt: new Date().toISOString(),
      relatedPotId: potId,
    });

    batch.update(doc(db, 'savingsPots', potId), {
      currentBalance: pot.currentBalance - amount,
    });

    await batch.commit();
  },

  allocateIncome: async (allocations, totalNote, date) => {
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');

    const { pots } = get();
    const batch = writeBatch(db);

    let totalAllocated = 0;

    for (const { potId, amount } of allocations) {
      if (amount <= 0) continue;
      const pot = pots.find(p => p.id === potId);
      if (!pot) continue;

      totalAllocated += amount;

      const txRef = doc(collection(db, 'potTransactions'));
      batch.set(txRef, {
        potId,
        coupleId: userProfile.coupleId,
        type: 'deposit',
        amount,
        note: totalNote.trim() || 'Alokasi Gaji',
        date,
        addedBy: userProfile.displayName,
        createdAt: new Date().toISOString(),
      });

      const mainTxRef = doc(collection(db, 'transactions'));
      batch.set(mainTxRef, {
        userId: userProfile.uid,
        coupleId: userProfile.coupleId,
        type: 'income',
        category: 'gaji',
        amount,
        description: `[Alokasi Pos ${pot.name}] ${totalNote.trim() || 'Gaji'}`,
        date,
        addedBy: userProfile.displayName,
        createdAt: new Date().toISOString(),
        relatedPotId: potId,
      });

      batch.update(doc(db, 'savingsPots', potId), {
        currentBalance: pot.currentBalance + amount,
      });
    }

    await batch.commit();
  },
}));
