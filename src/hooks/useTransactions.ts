import { useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';

export function useTransactions() {
  const coupleId = useAuthStore(s => s.userProfile?.coupleId);
  
  // Use selective state to prevent unnecessary re-renders
  const transactions = useDataStore(s => s.transactions);
  const loading = useDataStore(s => s.txLoading);
  const error = useDataStore(s => s.txError);
  const initTransactions = useDataStore(s => s.initTransactions);
  const addTransaction = useDataStore(s => s.addTransaction);
  const deleteTransaction = useDataStore(s => s.deleteTransaction);

  useEffect(() => {
    if (coupleId) {
      const unsub = initTransactions();
      return () => unsub();
    }
  }, [coupleId, initTransactions]);

  return { transactions, loading, error, addTransaction, deleteTransaction };
}

export function useBudgets() {
  const coupleId = useAuthStore(s => s.userProfile?.coupleId);
  
  const budgets = useDataStore(s => s.budgets);
  const loading = useDataStore(s => s.budgetLoading);
  const error = useDataStore(s => s.budgetError);
  const initBudgets = useDataStore(s => s.initBudgets);
  const setBudget = useDataStore(s => s.setBudget);
  const deleteBudget = useDataStore(s => s.deleteBudget);

  useEffect(() => {
    if (coupleId) {
      const unsub = initBudgets();
      return () => unsub();
    }
  }, [coupleId, initBudgets]);

  return { budgets, loading, error, setBudget, deleteBudget };
}