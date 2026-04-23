import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Filter, AlertTriangle, Calendar } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { useTransactions } from '../hooks/useTransactions';
import { formatRupiah, getCategoryInfo, TransactionType, ALL_CATEGORIES } from '../types';
import TransactionModal from '../components/TransactionModal';

export default function Transactions() {
  const { userProfile } = useAuth();
  const { transactions, loading, error, deleteTransaction } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      
      if (search) {
        const cat = getCategoryInfo(tx.category);
        const q = search.toLowerCase();
        return (
          tx.description?.toLowerCase().includes(q) ||
          cat.label.toLowerCase().includes(q) ||
          tx.addedBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, filterType, startDate, endDate, search]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach(tx => {
      const key = tx.date.substring(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  async function handleDelete(id: string) {
    setTxToDelete(id);
  }

  async function confirmDelete() {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(txToDelete);
      setTxToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl lg:text-3xl text-sage-900">Transaksi</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-sage-700 text-cream-100 rounded-2xl font-semibold hover:bg-sage-800 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4">
          <div className="text-xs text-sage-500 mb-1">Total Pemasukan</div>
          <div className="font-mono font-semibold text-sage-700">{formatRupiah(totalIncome)}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="text-xs text-sage-500 mb-1">Total Pengeluaran</div>
          <div className="font-mono font-semibold text-rose-600">{formatRupiah(totalExpense)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-4 border border-cream-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-11 pr-4 py-3 bg-cream-50 border border-cream-200 rounded-2xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors text-sm"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Type filter */}
          <div className="flex gap-1 bg-cream-100 p-1 rounded-xl">
            {(['all', 'income', 'expense'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === t ? 'bg-white text-sage-800 shadow-sm' : 'text-sage-500'
                  }`}
              >
                {t === 'all' ? 'Semua' : t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>

          {/* Date Range filter */}
          <div className="flex items-center gap-2 bg-cream-50 p-1 rounded-xl border border-cream-200">
            <div className="flex items-center pl-2 text-sage-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1.5 text-sm text-sage-700 focus:outline-none bg-transparent"
              title="Dari Tanggal"
            />
            <span className="text-sage-300">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1.5 text-sm text-sage-700 focus:outline-none bg-transparent"
              title="Sampai Tanggal"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {error ? (
        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-200 flex flex-col items-center justify-center py-12 text-center animate-fade-in">
          <AlertTriangle className="w-10 h-10 text-rose-400 mb-3" />
          <h3 className="text-rose-800 font-medium font-display mb-1">Gagal Memuat Transaksi</h3>
          <p className="text-sm text-rose-600 max-w-sm">
            {error.includes('permission-denied')
              ? 'Anda tidak memiliki izin untuk mengakses data ini.'
              : error}
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-cream-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 text-sage-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-body">Tidak ada transaksi ditemukan</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  {format(parseISO(date), 'EEEE, dd MMMM yyyy', { locale: id })}
                </div>
                <div className="flex-1 h-px bg-cream-200" />
                <div className="text-xs font-mono text-sage-500">
                  {formatRupiah(
                    txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                    txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                  )}
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-cream-200 divide-y divide-cream-100 overflow-hidden">
                {txs.map(tx => {
                  const cat = getCategoryInfo(tx.category);
                  const isMine = tx.addedBy === userProfile?.displayName;
                  
                  return (
                    <div key={tx.id} className="group flex items-center gap-4 p-4 hover:bg-cream-50/50 transition-all border-b border-transparent hover:border-cream-100 cursor-pointer">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-cream-100 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sage-800 text-sm truncate">
                          {tx.description || cat.label}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-sage-400 font-medium">{cat.label}</span>
                          <div className="w-1 h-1 rounded-full bg-cream-200"></div>
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isMine ? 'bg-sage-100 text-sage-600' : 'bg-rose-100 text-rose-600'}`}>
                            {isMine ? 'Saya' : 'Pasangan'}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-sage-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2.5 rounded-xl text-sage-300 hover:text-rose-500 hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <TransactionModal onClose={() => setShowModal(false)} />}
      
      <ConfirmModal
        isOpen={!!txToDelete}
        title="Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus transaksi ini? Saldo dan statistik akan otomatis diperbarui."
        onConfirm={confirmDelete}
        onCancel={() => setTxToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
