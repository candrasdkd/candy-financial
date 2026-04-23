import { useMemo } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction, getCategoryInfo } from '../types';

export function useDashboardStats(transactions: Transaction[], date: Date = new Date()) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // 1. Filter transaksi bulan ini
  const thisMonthTx = useMemo(() => {
    return transactions.filter(tx => {
      try {
        const txDate = parseISO(tx.date);
        return isWithinInterval(txDate, { start: monthStart, end: monthEnd });
      } catch {
        return false;
      }
    });
  }, [transactions, monthStart, monthEnd]);

  // 2. Hitung total pemasukan, pengeluaran, saldo
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    thisMonthTx.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    };
  }, [thisMonthTx]);

  // 3. Chart data 7 hari terakhir
  const chartData = useMemo(() => {
    const days: { date: string; pemasukan: number; pengeluaran: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      
      const dayTx = transactions.filter(t => t.date.startsWith(key));
      let pemasukan = 0;
      let pengeluaran = 0;
      
      dayTx.forEach(t => {
        if (t.type === 'income') pemasukan += t.amount;
        else if (t.type === 'expense') pengeluaran += t.amount;
      });

      days.push({
        date: format(d, 'dd MMM', { locale: id }),
        pemasukan,
        pengeluaran,
      });
    }
    return days;
  }, [transactions]);

  // 4. Pie chart data pengeluaran per kategori bulan ini
  const pieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    
    return Object.entries(grouped)
      // Sort descending based on value
      .sort(([, valA], [, valB]) => valB - valA)
      .map(([cat, val]) => {
        const info = getCategoryInfo(cat as any);
        return {
          name: info.label,
          value: val,
          emoji: info.emoji,
        };
      });
  }, [thisMonthTx]);

  // 5. Transaksi terbaru (5 transaksi)
  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  return {
    thisMonthTx,
    totalIncome,
    totalExpense,
    balance,
    chartData,
    pieData,
    recentTx,
  };
}
