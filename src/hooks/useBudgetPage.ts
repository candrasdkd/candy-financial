import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useBudgets, useTransactions } from '../hooks/useTransactions';
import { useBudgetStats } from '../hooks/useBudgetStats';
import { useConfirmStore } from '../store/useConfirmStore';
import { Category, EXPENSE_CATEGORIES, MAX_AMOUNT, parseRupiah } from '../types';

export function useBudgetPage() {
  const { budgets, loading: budgetsLoading, error, setBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [editing, setEditing] = useState<Category | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>('makan');
  const [loading, setLoading] = useState(false);
  const { confirm, close, setLoading: setConfirmLoading } = useConfirmStore();

  const monthBudgets = budgets.filter(b => b.month === month);
  const { expenseByCategory } = useBudgetStats(transactions, month);

  const { totalLimit, totalSpent } = useMemo(() => {
    const limit = monthBudgets.reduce((s, b) => s + b.limit, 0);
    const spent = monthBudgets.reduce((s, b) => s + (expenseByCategory[b.category] || 0), 0);
    return { totalLimit: limit, totalSpent: spent };
  }, [monthBudgets, expenseByCategory]);

  const totalPct = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  const handleSave = async (cat: Category) => {
    const limit = parseRupiah(limitInput);
    if (!limit || limit <= 0) return;
    
    if (limit > MAX_AMOUNT) {
      alert(`Maksimal anggaran per kategori adalah Rp ${MAX_AMOUNT.toLocaleString('id-ID')}`);
      return;
    }

    setLoading(true);
    try {
      await setBudget(cat, limit, month);
      setEditing(null);
      setAddingNew(false);
      setLimitInput('');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    confirm({
      title: 'Hapus Anggaran',
      message: 'Apakah Anda yakin ingin menghapus anggaran bulan ini? Data yang sudah dihapus tidak dapat dikembalikan.',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await deleteBudget(id);
          close();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  const availableCategories = EXPENSE_CATEGORIES.filter(
    c => !monthBudgets.some(b => b.category === c.value)
  );

  return {
    month,
    setMonth,
    editing,
    setEditing,
    limitInput,
    setLimitInput,
    addingNew,
    setAddingNew,
    newCategory,
    setNewCategory,
    loading,
    budgetsLoading,
    error,
    monthBudgets,
    expenseByCategory,
    totalLimit,
    totalSpent,
    totalPct,
    handleSave,
    handleDelete,
    availableCategories
  };
}
