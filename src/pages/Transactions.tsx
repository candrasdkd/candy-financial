import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Filter, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTransactions } from '../hooks/useTransactions';
import { formatRupiah, getCategoryInfo, TransactionType, ALL_CATEGORIES } from '../types';
import TransactionModal from '../components/TransactionModal';

export default function Transactions() {
  const { transactions, loading, error, deleteTransaction } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterMonth && !tx.date.startsWith(filterMonth)) return false;
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
  }, [transactions, filterType, filterMonth, search]);

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
    if (!confirm('Hapus transaksi ini?')) return;
    await deleteTransaction(id);
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

          {/* Month filter */}
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 border border-cream-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:border-sage-400 bg-white"
          />
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
                  return (
                    <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-cream-50 transition-colors group">
                      <div className="w-11 h-11 rounded-full bg-cream-100 flex items-center justify-center text-xl flex-shrink-0">
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sage-800 text-sm">
                          {tx.description || cat.label}
                        </div>
                        <div className="text-xs text-sage-400 mt-0.5">
                          {cat.label} · {tx.addedBy}
                        </div>
                      </div>
                      <div className={`font-mono font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-sage-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 rounded-xl text-sage-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
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
    </div>
  );
}
