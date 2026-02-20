import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { PiggyBank, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useBudgets } from '../hooks/useTransactions';
import { useTransactions } from '../hooks/useTransactions';
import { EXPENSE_CATEGORIES, getCategoryInfo, formatRupiah, Category } from '../types';

export default function Budget() {
  const { budgets, loading: budgetsLoading, error, setBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [editing, setEditing] = useState<Category | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>('makan');
  const [loading, setLoading] = useState(false);

  const monthBudgets = budgets.filter(b => b.month === month);

  const monthDate = new Date(month + '-01');
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(tx => {
        try {
          return tx.type === 'expense' && isWithinInterval(parseISO(tx.date), { start: monthStart, end: monthEnd });
        } catch { return false; }
      })
      .forEach(tx => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      });
    return map;
  }, [transactions, month]);

  async function handleSave(cat: Category) {
    const limit = parseInt(limitInput.replace(/\D/g, ''));
    if (!limit || limit <= 0) return;
    setLoading(true);
    try {
      await setBudget(cat, limit, month);
      setEditing(null);
      setAddingNew(false);
      setLimitInput('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus anggaran ini?')) return;
    await deleteBudget(id);
  }

  const availableCategories = EXPENSE_CATEGORIES.filter(
    c => !monthBudgets.some(b => b.category === c.value)
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl lg:text-3xl text-sage-900">Anggaran</h1>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 border border-cream-200 rounded-xl text-sm text-sage-700 focus:outline-none focus:border-sage-400 bg-white"
          />
          {availableCategories.length > 0 && (
            <button
              onClick={() => { setAddingNew(true); setNewCategory(availableCategories[0].value); setLimitInput(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-sage-700 text-cream-100 rounded-xl font-medium text-sm hover:bg-sage-800 transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* Add New Budget */}
      {addingNew && (
        <div className="bg-white rounded-3xl border-2 border-sage-300 p-5 animate-scale-in">
          <h3 className="font-display text-lg text-sage-800 mb-4">Atur Anggaran Baru</h3>
          <div className="flex gap-3 flex-wrap">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Category)}
              className="flex-1 min-w-0 px-4 py-2.5 border border-cream-200 rounded-xl text-sage-800 focus:outline-none focus:border-sage-400 bg-white text-sm"
            >
              {availableCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[140px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-500 font-mono text-sm">Rp</span>
              <input
                type="text"
                value={limitInput}
                onChange={e => {
                  const n = e.target.value.replace(/\D/g, '');
                  setLimitInput(n ? parseInt(n).toLocaleString('id-ID') : '');
                }}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-xl font-mono text-sage-900 focus:outline-none focus:border-sage-400 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(newCategory)}
                disabled={loading}
                className="px-5 py-2.5 bg-sage-600 text-white rounded-xl text-sm font-medium hover:bg-sage-700 disabled:opacity-60"
              >
                Simpan
              </button>
              <button
                onClick={() => setAddingNew(false)}
                className="px-5 py-2.5 border border-cream-200 text-sage-600 rounded-xl text-sm font-medium hover:bg-cream-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      {error ? (
        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-200 flex flex-col items-center justify-center py-12 text-center animate-fade-in">
          <AlertTriangle className="w-10 h-10 text-rose-400 mb-3" />
          <h3 className="text-rose-800 font-medium font-display mb-1">Gagal Memuat Anggaran</h3>
          <p className="text-sm text-rose-600 max-w-sm">
            {error.includes('permission-denied')
              ? 'Anda tidak memiliki izin untuk mengakses data ini.'
              : error}
          </p>
        </div>
      ) : budgetsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-cream-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : monthBudgets.length === 0 ? (
        <div className="text-center py-20 text-sage-400">
          <PiggyBank className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-body">Belum ada anggaran untuk bulan ini.</p>
          <p className="text-sm mt-1">Klik "Tambah" untuk mulai mengatur anggaran.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthBudgets.map(budget => {
            const cat = getCategoryInfo(budget.category);
            const spent = expenseByCategory[budget.category] || 0;
            const pct = Math.min((spent / budget.limit) * 100, 100);
            const over = spent > budget.limit;
            const nearLimit = pct >= 80 && !over;
            const isEditing = editing === budget.category;

            return (
              <div key={budget.id} className={`bg-white rounded-3xl border-2 p-5 transition-all ${over ? 'border-rose-200' : nearLimit ? 'border-cream-400' : 'border-cream-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <div className="font-semibold text-sage-800">{cat.label}</div>
                      <div className="text-xs text-sage-400 font-mono">
                        {formatRupiah(spent)} / {formatRupiah(budget.limit)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(over || nearLimit) && (
                      <AlertTriangle className={`w-4 h-4 ${over ? 'text-rose-500' : 'text-cream-600'}`} />
                    )}
                    <button
                      onClick={() => { setEditing(budget.category); setLimitInput(budget.limit.toLocaleString('id-ID')); }}
                      className="p-2 text-sage-400 hover:text-sage-700 hover:bg-cream-100 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-sage-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-500 font-mono text-sm">Rp</span>
                      <input
                        type="text"
                        value={limitInput}
                        onChange={e => {
                          const n = e.target.value.replace(/\D/g, '');
                          setLimitInput(n ? parseInt(n).toLocaleString('id-ID') : '');
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-cream-200 rounded-xl font-mono text-sage-900 focus:outline-none focus:border-sage-400 text-sm"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleSave(budget.category)}
                      disabled={loading}
                      className="px-4 py-2 bg-sage-600 text-white rounded-xl text-sm font-medium hover:bg-sage-700 disabled:opacity-60"
                    >
                      Simpan
                    </button>
                    <button onClick={() => setEditing(null)} className="px-4 py-2 border border-cream-200 text-sage-600 rounded-xl text-sm">
                      Batal
                    </button>
                  </div>
                ) : null}

                {/* Progress Bar */}
                <div className="h-2.5 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : nearLimit ? 'bg-cream-500' : 'bg-sage-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-sage-400">
                  <span>{pct.toFixed(0)}% terpakai</span>
                  <span className={over ? 'text-rose-500 font-medium' : ''}>
                    {over
                      ? `Melebihi ${formatRupiah(spent - budget.limit)}`
                      : `Sisa ${formatRupiah(budget.limit - spent)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
