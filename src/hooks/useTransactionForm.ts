import { useState, useEffect, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionType, Category, INCOME_CATEGORIES, EXPENSE_CATEGORIES, MAX_AMOUNT, parseRupiah } from '../types';
import { format } from 'date-fns';

export function useTransactionForm(onClose: () => void) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('makan');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isExpense = type === 'expense';

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 400);
  }, []);

  const formatAmount = (val: string) => {
    const num = parseRupiah(val);
    return num ? num.toLocaleString('id-ID') : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = parseRupiah(amount);
    
    if (!numAmount || numAmount <= 0) {
      setError('Masukkan jumlah yang valid');
      return;
    }
    
    if (numAmount > MAX_AMOUNT) {
      setError(`Maksimal transaksi adalah Rp ${MAX_AMOUNT.toLocaleString('id-ID')}`);
      return;
    }

    setLoading(true);
    try {
      await addTransaction({ type, category, amount: numAmount, description, date });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };


  return {
    type,
    setType,
    amount,
    setAmount,
    category,
    setCategory,
    description,
    setDescription,
    date,
    setDate,
    loading,
    error,
    setError,
    amountRef,
    categories,
    isExpense,
    formatAmount,
    handleSubmit
  };
}
