import { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
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

export default function TransactionModal({ onClose }: Props) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('makan');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isExpense = type === 'expense';

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setTimeout(() => amountRef.current?.focus(), 300);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const numAmount = parseInt(amount.replace(/\D/g, ''));
    if (!numAmount || numAmount <= 0) {
      setError('Masukkan jumlah yang valid');
      return;
    }
    setLoading(true);
    try {
      await addTransaction({ type, category, amount: numAmount, description, date });
      handleClose();
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

  const accentBg = isExpense ? 'bg-rose-500' : 'bg-sage-600';
  const accentText = isExpense ? 'text-rose-500' : 'text-sage-600';
  const accentBorder = isExpense ? 'border-rose-400' : 'border-sage-400';
  const accentLight = isExpense ? 'bg-rose-50' : 'bg-sage-50';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sheet / Modal */}
      <div
        className={`
          relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          max-h-[92dvh] sm:max-h-[90vh]
          ${visible ? 'translate-y-0 sm:scale-100 sm:opacity-100' : 'translate-y-full sm:scale-95 sm:opacity-0'}
        `}
      >
        {/* Drag Handle (mobile only) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4 sm:pt-5 sm:px-6 flex-shrink-0">
          <div>
            <h2 className="font-display text-xl text-sage-900">Tambah Transaksi</h2>
            <p className="text-xs text-sage-400 mt-0.5">Catat pemasukan atau pengeluaran</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors text-sage-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle — full width strip */}
        <div className="px-5 sm:px-6 pb-4 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-cream-100 rounded-2xl">
            {([
              { val: 'expense', label: 'Pengeluaran', icon: TrendingDown, color: 'text-rose-500' },
              { val: 'income', label: 'Pemasukan', icon: TrendingUp, color: 'text-sage-600' },
            ] as const).map(({ val, label, icon: Icon, color }) => (
              <button
                key={val}
                type="button"
                onClick={() => { setType(val); setCategory(val === 'expense' ? 'makan' : 'gaji'); }}
                className={`
                  flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${type === val
                    ? `bg-white shadow-sm ${color}`
                    : 'text-sage-400 hover:text-sage-600'}
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 space-y-5 pb-2">

            {/* Amount — big hero input */}
            <div className={`rounded-2xl p-4 ${accentLight} border-2 ${accentBorder} transition-colors duration-300`}>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${accentText}`}>
                Jumlah
              </label>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-lg ${accentText}`}>Rp</span>
                <input
                  ref={amountRef}
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={e => setAmount(formatAmount(e.target.value))}
                  placeholder="0"
                  required
                  className={`flex-1 bg-transparent font-mono text-3xl font-bold text-sage-900 focus:outline-none placeholder-sage-300 min-w-0`}
                />
              </div>
            </div>

            {/* Category grid */}
            <div>
              <label className="block text-xs font-bold text-sage-400 uppercase tracking-widest mb-3">
                Kategori
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {categories.map(cat => {
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`
                        flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 text-xs font-medium
                        transition-all duration-150 active:scale-95
                        ${active
                          ? `${accentBorder} ${accentLight} ${accentText} shadow-sm`
                          : 'border-cream-200 text-sage-500 hover:border-cream-300 hover:bg-cream-50'
                        }
                      `}
                    >
                      <span className={`text-xl leading-none transition-transform duration-150 ${active ? 'scale-110' : ''}`}>
                        {cat.emoji}
                      </span>
                      <span className="leading-tight text-center text-[10px]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description + Date side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-sage-400 uppercase tracking-widest mb-2">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Misal: Makan siang berdua"
                  className="w-full px-4 py-3 border-2 border-cream-200 rounded-xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sage-400 uppercase tracking-widest mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-cream-200 rounded-xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors text-sm bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}
          </div>

          {/* Submit — sticky footer */}
          <div className="px-5 sm:px-6 pt-3 pb-5 sm:pb-6 flex-shrink-0 border-t border-cream-100 mt-2">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-4 rounded-2xl font-bold text-white text-base
                transition-all duration-200
                ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-105 active:scale-[0.98]'}
                ${accentBg}
                shadow-lg
              `}
              style={{ boxShadow: isExpense ? '0 8px 24px rgba(225,79,108,0.3)' : '0 8px 24px rgba(90,132,93,0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                `Simpan ${isExpense ? 'Pengeluaran' : 'Pemasukan'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}