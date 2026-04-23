import { useMemo } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Transaction } from '../types';

export function useBudgetStats(transactions: Transaction[], monthString: string) {
  return useMemo(() => {
    const monthDate = new Date(monthString + '-01');
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach(tx => {
      if (tx.type !== 'expense') return;

      try {
        const txDate = parseISO(tx.date);
        if (isWithinInterval(txDate, { start: monthStart, end: monthEnd })) {
          expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
        }
      } catch {
        // Abaikan jika date tidak valid
      }
    });

    return {
      expenseByCategory,
      monthStart,
      monthEnd
    };
  }, [transactions, monthString]);
}
