import {
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  PieChart,
  TrendingDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useBudgetPage } from '../hooks/useBudgetPage';
import { getCategoryInfo, formatRupiah, Category } from '../types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function Budget() {
  const {
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
  } = useBudgetPage();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 lg:p-12 max-w-5xl mx-auto space-y-10 pb-32"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-sage-400 mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Manajemen Budget</span>
          </div>
          <h1 className="font-display text-4xl text-sage-900 tracking-tight">Atur Anggaran</h1>
        </div>

        <div className="flex items-center gap-3 bg-white border border-sage-100 p-2 rounded-[2rem] shadow-xl shadow-sage-900/5">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker()}
            className="px-6 py-2.5 bg-sage-50/50 border border-sage-100 rounded-[1.5rem] text-sm font-bold text-sage-700 focus:outline-none cursor-pointer"
          />
          {availableCategories.length > 0 && (
            <button
              onClick={() => { setAddingNew(true); setNewCategory(availableCategories[0].value); setLimitInput(''); }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-sage-800 text-white rounded-[1.5rem] font-bold text-sm hover:bg-sage-900 transition-all active:scale-95 shadow-lg shadow-sage-900/10"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Hero Budget Summary */}
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-sage-800 to-sage-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-rose-400/10 rounded-full blur-[60px]" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-rose-300 fill-rose-300" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Status Bulan Ini</span>
            </div>
            <div>
              <div className="text-5xl font-mono font-bold tracking-tighter mb-2">{totalPct.toFixed(1)}%</div>
              <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                Kamu telah menghabiskan {formatRupiah(totalSpent)} dari total anggaran {formatRupiah(totalLimit)}.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${totalPct > 90 ? 'bg-rose-400' : totalPct > 70 ? 'bg-amber-300' : 'bg-emerald-400'}`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">
              <span>Mulai</span>
              <span>Terpakai</span>
              <span>Batas</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {addingNew && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
            className="bg-white border-2 border-sage-200 rounded-[2.5rem] p-8 shadow-2xl shadow-sage-900/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-2xl text-sage-900">Atur Anggaran Baru</h3>
              <button onClick={() => setAddingNew(false)} className="p-2 hover:bg-sage-50 rounded-xl transition-colors">
                <X className="w-6 h-6 text-sage-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-sage-400 uppercase tracking-widest px-1">Pilih Kategori</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as Category)}
                  className="w-full px-6 py-4 bg-sage-50 border border-sage-100 rounded-2xl text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500/20 transition-all font-bold"
                >
                  {availableCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-sage-400 uppercase tracking-widest px-1">Batas Anggaran</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sage-400 font-mono font-bold">Rp</span>
                  <input
                    type="text"
                    value={limitInput}
                    onChange={e => {
                      const n = e.target.value.replace(/\D/g, '');
                      setLimitInput(n ? parseInt(n).toLocaleString('id-ID') : '');
                    }}
                    placeholder="0"
                    className="w-full pl-14 pr-6 py-4 bg-sage-50 border border-sage-100 rounded-2xl font-mono text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500/20 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSave(newCategory)}
                disabled={loading}
                className="flex-1 py-4 bg-sage-800 text-white rounded-2xl font-bold hover:bg-sage-900 transition-all shadow-xl shadow-sage-900/10 disabled:opacity-50"
              >
                Simpan Anggaran
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget List */}
      <div className="space-y-6">
        {error ? (
          <div className="bg-rose-50 p-12 rounded-[3rem] border border-rose-100 flex flex-col items-center text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mb-6" />
            <h3 className="font-display text-2xl text-rose-900 mb-2">Gagal Memuat</h3>
            <p className="text-rose-600 max-w-sm text-sm font-medium leading-relaxed">
              {error.includes('permission-denied') ? 'Kamu tidak memiliki akses.' : error}
            </p>
          </div>
        ) : budgetsLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-sage-50/50 rounded-[2.5rem] animate-pulse border border-sage-50" />)}
          </div>
        ) : monthBudgets.length === 0 ? (
          <div className="text-center py-24 bg-sage-50/30 rounded-[3rem] border border-dashed border-sage-100">
            <PiggyBank className="w-16 h-16 mx-auto text-sage-200 mb-6" />
            <h3 className="font-display text-2xl text-sage-800 mb-2">Celengan Masih Kosong</h3>
            <p className="text-sage-400 font-medium">Mulai atur anggaran pertamamu di bulan ini!</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} className="grid grid-cols-1 gap-6">
            {monthBudgets.map(budget => {
              const cat = getCategoryInfo(budget.category);
              const spent = expenseByCategory[budget.category] || 0;
              const pct = Math.min((spent / budget.limit) * 100, 100);
              const over = spent > budget.limit;
              const nearLimit = pct >= 80 && !over;
              const isEditing = editing === budget.category;

              return (
                <motion.div
                  key={budget.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className={`bg-white rounded-[2.5rem] p-8 border transition-all duration-500 shadow-sm hover:shadow-2xl ${over ? 'border-rose-100 shadow-rose-900/[0.05]' :
                      nearLimit ? 'border-amber-100 shadow-amber-900/[0.05]' :
                        'border-sage-50 shadow-sage-900/[0.03]'
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner ${over ? 'bg-rose-50 text-rose-500' : 'bg-sage-50 text-sage-500'
                        }`}>
                        <cat.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-sage-900 text-xl tracking-tight">{cat.label}</h4>
                          {over && <span className="bg-rose-100 text-rose-600 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Exceeded</span>}
                          {nearLimit && <span className="bg-amber-100 text-amber-700 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Warning</span>}
                        </div>
                        <div className="text-sm font-bold text-sage-400 font-mono mt-0.5">
                          {formatRupiah(spent)} <span className="mx-1 text-sage-200">/</span> {formatRupiah(budget.limit)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-sage-50/50 p-1.5 rounded-2xl border border-sage-50">
                      <button
                        onClick={() => { setEditing(budget.category); setLimitInput(budget.limit.toLocaleString('id-ID')); }}
                        className="p-2.5 text-sage-400 hover:text-sage-800 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-6 bg-sage-100" />
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-2.5 text-sage-400 hover:text-rose-500 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8"
                      >
                        <div className="flex gap-3 bg-sage-50 p-4 rounded-2xl border border-sage-100">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400 font-mono font-bold text-sm">Rp</span>
                            <input
                              type="text"
                              value={limitInput}
                              onChange={e => {
                                const n = e.target.value.replace(/\D/g, '');
                                setLimitInput(n ? parseInt(n).toLocaleString('id-ID') : '');
                              }}
                              className="w-full pl-11 pr-4 py-3 bg-white border border-sage-100 rounded-xl font-mono text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage-500/20 text-sm font-bold"
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => handleSave(budget.category)}
                            disabled={loading}
                            className="px-6 py-3 bg-sage-800 text-white rounded-xl text-sm font-bold hover:bg-sage-900 transition-all disabled:opacity-50 shadow-lg shadow-sage-900/10"
                          >
                            Update
                          </button>
                          <button onClick={() => setEditing(null)} className="p-3 text-sage-400 hover:text-sage-600">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Enhanced Progress Visualization */}
                  <div className="space-y-4">
                    <div className="h-3 bg-sage-50 rounded-full overflow-hidden p-0.5 border border-sage-50/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full transition-all duration-1000 ${over ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
                            nearLimit ? 'bg-gradient-to-r from-amber-300 to-amber-500' :
                              'bg-gradient-to-r from-emerald-400 to-emerald-600'
                          }`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${over ? 'text-rose-500' : 'text-sage-400'}`}>
                          {pct.toFixed(0)}% terpakai
                        </span>
                        {over && <TrendingDown className="w-3 h-3 text-rose-500" />}
                      </div>
                      <div className={`text-xs font-bold ${over ? 'text-rose-600' : 'text-sage-600'}`}>
                        {over
                          ? `Melebihi ${formatRupiah(spent - budget.limit)}`
                          : `Sisa ${formatRupiah(budget.limit - spent)} lagi`}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
