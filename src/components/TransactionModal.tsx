import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Loader2,
  Calendar,
  Type,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTransactions } from '../hooks/useTransactions';
import {
  TransactionType,
  Category,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../types';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
}

const containerVariants: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: 'spring', 
      damping: 25, 
      stiffness: 200,
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: { ease: 'easeInOut', duration: 0.3 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function TransactionModal({ onClose }: Props) {
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

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const numAmount = parseInt(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) {
      setError('Masukkan jumlah yang valid');
      return;
    }
    if (numAmount > 100000000) {
      setError('Maksimal transaksi adalah Rp 100.000.000');
      return;
    }
    setLoading(true);
    try {
      await addTransaction({ type, category, amount: numAmount, description, date });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(val: string) {
    const nums = val.replace(/\D/g, '');
    return nums ? parseInt(nums).toLocaleString('id-ID') : '';
  }

  const accentColor = isExpense ? 'rose' : 'emerald';
  const themeClasses = isExpense 
    ? {
        bg: 'bg-rose-500',
        text: 'text-rose-500',
        light: 'bg-rose-50',
        border: 'border-rose-100',
        shadow: 'shadow-rose-500/20'
      }
    : {
        bg: 'bg-emerald-600',
        text: 'text-emerald-600',
        light: 'bg-emerald-50',
        border: 'border-emerald-100',
        shadow: 'shadow-emerald-500/20'
      };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-6 !mt-0">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-sage-950/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative bg-white w-full sm:max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex flex-col max-h-[95dvh] overflow-hidden border border-white/20"
      >
        {/* Header Section */}
        <div className="flex-shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-rose-400">
                <Sparkles className="w-3 h-3 fill-rose-400" />
                <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Transaksi Baru</span>
              </div>
              <h2 className="font-display text-2xl text-sage-900 tracking-tight">Catat Keuangan</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-sage-50 text-sage-400 hover:bg-sage-100 hover:text-sage-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Toggle */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-1.5 p-1 bg-sage-50 rounded-[1.5rem] border border-sage-100">
            {[
              { val: 'expense', label: 'Keluar', icon: TrendingDown, color: 'text-rose-500' },
              { val: 'income', label: 'Masuk', icon: TrendingUp, color: 'text-emerald-600' },
            ].map(({ val, label, icon: Icon, color }) => (
              <button
                key={val}
                type="button"
                disabled={loading}
                onClick={() => { setType(val as TransactionType); setCategory(val === 'expense' ? 'makan' : 'gaji'); }}
                className={`
                  flex items-center justify-center gap-2.5 py-3 rounded-[1.2rem] text-[11px] font-bold uppercase tracking-wider
                  transition-all duration-300 disabled:opacity-50
                  ${type === val
                    ? `bg-white shadow-lg ${color}`
                    : 'text-sage-400 hover:text-sage-600'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6 custom-scrollbar">
            
            {/* Amount Input */}
            <motion.div variants={itemVariants} className={`rounded-[2rem] p-6 ${themeClasses.light} border-2 ${themeClasses.border} transition-colors duration-500 shadow-inner`}>
              <label className={`block text-[9px] font-black uppercase tracking-[0.2em] mb-3 text-center ${themeClasses.text}`}>
                Nominal {type === 'expense' ? 'Keluar' : 'Masuk'}
              </label>
              <div className="flex items-center justify-center gap-2">
                <span className={`font-mono font-black text-xl ${themeClasses.text} opacity-40`}>Rp</span>
                <input
                  ref={amountRef}
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  disabled={loading}
                  onChange={e => setAmount(formatAmount(e.target.value))}
                  placeholder="0"
                  required
                  className={`bg-transparent font-mono text-4xl font-black text-sage-900 focus:outline-none placeholder-sage-200 text-center w-full tracking-tighter disabled:opacity-50`}
                />
              </div>
            </motion.div>

            {/* ERROR MESSAGE - Moved here for better visibility */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    x: [0, -4, 4, -4, 4, 0] // Shake animation
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-center gap-2 text-rose-600 text-[11px] font-black uppercase tracking-widest bg-rose-50 border-2 border-rose-100 px-6 py-4 rounded-[1.5rem] shadow-lg shadow-rose-900/10"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category Grid */}
            <motion.div variants={itemVariants} className="space-y-3">
              <label className="block text-[9px] font-black text-sage-400 uppercase tracking-[0.2em] px-1">
                Pilih Kategori
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {categories.map(cat => {
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      disabled={loading}
                      onClick={() => setCategory(cat.value)}
                      className={`
                        flex flex-col items-center gap-1.5 p-3 rounded-[1.2rem] border-2 text-[9px] font-black uppercase tracking-tighter
                        transition-all duration-300 active:scale-95 disabled:opacity-50
                        ${active
                          ? `${themeClasses.border} ${themeClasses.light} ${themeClasses.text} shadow-md`
                          : 'border-sage-50 text-sage-400 hover:border-sage-100 hover:bg-sage-50'
                        }
                      `}
                    >
                      <cat.icon className={`w-6 h-6 transition-transform duration-500 ${active ? 'scale-110' : 'opacity-60'}`} />
                      <span className="leading-tight text-center truncate w-full">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Details Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] font-black text-sage-400 uppercase tracking-[0.2em] px-1">
                  <Type className="w-3 h-3" /> Keterangan
                </label>
                <input
                  type="text"
                  value={description}
                  disabled={loading}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Misal: Makan malam"
                  className="w-full px-5 py-3.5 bg-sage-50 border border-sage-100 rounded-xl text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500/20 transition-all font-bold disabled:opacity-50 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[9px] font-black text-sage-400 uppercase tracking-[0.2em] px-1">
                  <Calendar className="w-3 h-3" /> Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  disabled={loading}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-sage-50 border border-sage-100 rounded-xl text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500/20 transition-all font-bold disabled:opacity-50 cursor-pointer text-sm"
                />
              </div>
            </motion.div>
          </div>

          {/* Sticky Submit Button */}
          <div className="flex-shrink-0 p-6 border-t border-sage-50 bg-white/80 backdrop-blur-xl">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-4 rounded-[1.8rem] font-black text-white text-sm uppercase tracking-[0.2em]
                transition-all duration-300 shadow-xl
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}
                ${themeClasses.bg}
                ${themeClasses.shadow}
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Simpan Transaksi
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}