import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, Heart, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
} as const;
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '../store/useAuthStore';
import { useTransactions } from '../hooks/useTransactions';
import { formatRupiah, getCategoryInfo } from '../types';
import { useDashboardStats } from '../hooks/useDashboardStats';
import TransactionModal from '../components/TransactionModal';
import { Link } from 'react-router-dom';

const COLORS = [
  '#4F6F52', // Sage Green
  '#E6A4B4', // Rose Pink
  '#7A9D54', // Olive
  '#F3D7CA', // Peach
  '#8EACCD', // Soft Blue
  '#D2E0FB', // Sky
  '#B4BDFF', // Lavender
  '#F9F3CC', // Cream
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-cream-200 p-4 rounded-2xl shadow-xl shadow-sage-900/10">
        <p className="text-sage-500 text-xs mb-3 font-medium">{label}</p>
        <div className="space-y-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.payload.fill }} />
                <span className="text-sage-800">{p.name}</span>
              </div>
              <span className="font-mono text-sage-900">{formatRupiah(p.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { userProfile } = useAuthStore();
  const { transactions, loading } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const now = new Date();

  const {
    totalIncome,
    totalExpense,
    balance,
    chartData,
    pieData,
    recentTx,
    thisMonthTx,
  } = useDashboardStats(transactions, now);

  if (!userProfile?.coupleId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-rose-400 fill-rose-400" />
        </div>
        <h2 className="font-display text-2xl text-sage-800 mb-3">Hubungkan dengan Pasangan</h2>
        <p className="text-sage-500 mb-6 max-w-sm">
          Sebelum mulai, hubungkan akun Anda dengan pasangan untuk mengelola keuangan bersama.
        </p>
        <Link
          to="/settings"
          className="px-8 py-3 bg-sage-700 text-cream-100 rounded-2xl font-semibold hover:bg-sage-800 transition-colors"
        >
          Hubungkan Sekarang
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-sage-900">
            Halo, {userProfile.displayName}
          </h1>
          <p className="text-sage-500 text-sm mt-1">
            {format(now, 'EEEE, dd MMMM yyyy', { locale: id })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-sage-700 text-cream-100 rounded-2xl font-semibold hover:bg-sage-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-sage-700/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2rem] text-white shadow-2xl ${balance >= 0 ? 'bg-gradient-to-br from-sage-700 to-sage-900 shadow-sage-900/20' : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-900/20'} relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]`}>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Wallet className="w-5 h-5 text-cream-100" />
            </div>
            <span className="text-sm font-medium text-cream-100/80 font-body">Saldo Bulan Ini</span>
          </div>
          <div className="font-mono text-3xl lg:text-4xl font-bold relative z-10 tracking-tight">{formatRupiah(balance)}</div>
          <div className="text-xs font-medium opacity-60 mt-3 relative z-10">{format(now, 'MMMM yyyy', { locale: id })}</div>
        </div>

        <div className="p-8 rounded-[2rem] bg-white border border-cream-200 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-sage-500 font-medium font-body">Pemasukan</span>
          </div>
          <div className="font-mono text-3xl font-bold text-emerald-600 relative z-10 tracking-tight">{formatRupiah(totalIncome)}</div>
          <div className="text-xs text-sage-400 mt-3 relative z-10 font-medium">{thisMonthTx.filter(t => t.type === 'income').length} transaksi terdaftar</div>
        </div>

        <div className="p-8 rounded-[2rem] bg-white border border-cream-200 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-sm text-sage-500 font-medium font-body">Pengeluaran</span>
          </div>
          <div className="font-mono text-3xl font-bold text-rose-600 relative z-10 tracking-tight">{formatRupiah(totalExpense)}</div>
          <div className="text-xs text-sage-400 mt-3 relative z-10 font-medium">{thisMonthTx.filter(t => t.type === 'expense').length} transaksi terdaftar</div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-cream-200">
          <h3 className="font-display text-lg text-sage-800 mb-4">7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorIncome)"
                strokeWidth={4}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                fillOpacity={1}
                fill="url(#colorExpense)"
                strokeWidth={4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-3xl p-6 border border-cream-200">
          <h3 className="font-display text-lg text-sage-800 mb-4">Pengeluaran</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <item.icon className="w-4 h-4" />
                      <span className="text-sage-600">{item.name}</span>
                    </div>
                    <span className="font-mono text-sage-800">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-sage-400 text-sm">
              Belum ada pengeluaran
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-cream-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-sage-800">Transaksi Terbaru</h3>
          <Link to="/transactions" className="text-sage-600 text-sm font-medium flex items-center gap-1 hover:text-sage-800">
            Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-cream-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentTx.length === 0 ? (
          <div className="text-center py-12 text-sage-400">
            <Inbox className="w-12 h-12 mx-auto text-sage-300 mb-3" />
            <p>Belum ada transaksi. Mulai catat sekarang!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map(tx => {
              const cat = getCategoryInfo(tx.category);
              const isMine = tx.addedBy === userProfile.displayName;
              
              return (
                <div key={tx.id} className="group flex items-center gap-4 p-3.5 rounded-2xl hover:bg-cream-50/50 hover:shadow-sm transition-all border border-transparent hover:border-cream-100 cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-cream-100 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    <cat.icon className="w-6 h-6 text-sage-500 group-hover:text-sage-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sage-800 text-sm truncate">
                      {tx.description || cat.label}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-sage-400 font-medium">
                        {format(parseISO(tx.date), 'dd MMM', { locale: id })}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-cream-200"></div>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isMine ? 'bg-sage-100 text-sage-600' : 'bg-rose-100 text-rose-600'}`}>
                        {isMine ? 'Saya' : (userProfile?.partnerName || 'Pasangan')}
                      </div>
                    </div>
                  </div>
                  <div className={`font-mono font-bold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && <TransactionModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
