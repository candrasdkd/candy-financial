import { useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext';

export function useTransactions() {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.coupleId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Tidak pakai orderBy supaya tidak butuh Composite Index Firestore
    // Sort dilakukan di client side
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
        setTransactions(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore transactions error:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [userProfile?.coupleId]);

  async function addTransaction(data: Omit<Transaction, 'id' | 'coupleId' | 'userId' | 'createdAt' | 'addedBy'>) {
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');
    await addDoc(collection(db, 'transactions'), {
      ...data,
      userId: userProfile.uid,
      coupleId: userProfile.coupleId,
      addedBy: userProfile.displayName,
      createdAt: new Date().toISOString(),
    });
  }

  async function deleteTransaction(id: string) {
    await deleteDoc(doc(db, 'transactions', id));
  }

  async function updateTransaction(id: string, data: Partial<Transaction>) {
    await updateDoc(doc(db, 'transactions', id), data);
  }

  return { transactions, loading, error, addTransaction, deleteTransaction, updateTransaction };
}

export function useBudgets() {
  const { userProfile } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.coupleId) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'budgets'),
      where('coupleId', '==', userProfile.coupleId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
        setBudgets(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore budgets error:', err.code, err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [userProfile?.coupleId]);

  async function setBudget(category: string, limit: number, month: string) {
    if (!userProfile?.coupleId) throw new Error('Belum terhubung dengan pasangan');
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
  }

  async function deleteBudget(id: string) {
    await deleteDoc(doc(db, 'budgets', id));
  }

  return { budgets, loading, error, setBudget, deleteBudget };
}