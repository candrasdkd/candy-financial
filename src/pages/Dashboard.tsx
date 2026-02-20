import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, Heart } from 'lucide-react';
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
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { formatRupiah, getCategoryInfo } from '../types';
import TransactionModal from '../components/TransactionModal';
import { Link } from 'react-router-dom';

const COLORS = ['#5a845d', '#7da180', '#a8c2aa', '#e14f6c', '#ec7a90', '#f4aab7', '#cda06a', '#dabb8c', '#e8d5b4'];

export default function Dashboard() {
  const { userProfile } = useAuth();
  const { transactions, loading } = useTransactions();
  const [showModal, setShowModal] = useState(false);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthTx = useMemo(
    () =>
      transactions.filter(tx => {
        try {
          return isWithinInterval(parseISO(tx.date), { start: monthStart, end: monthEnd });
        } catch { return false; }
      }),
    [transactions]
  );

  const totalIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart data: last 7 days
  const chartData = useMemo(() => {
    const days: { date: string; pemasukan: number; pengeluaran: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      const dayTx = transactions.filter(t => t.date.startsWith(key));
      days.push({
        date: format(d, 'dd MMM', { locale: id }),
        pemasukan: dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        pengeluaran: dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return days;
  }, [transactions]);

  // Pie chart: expense by category this month
  const pieData = useMemo(() => {
    const grouped: Record<string, number> = {};
    thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    return Object.entries(grouped).map(([cat, val]) => ({
      name: getCategoryInfo(cat as any).label,
      value: val,
      emoji: getCategoryInfo(cat as any).emoji,
    }));
  }, [thisMonthTx]);

  const recentTx = transactions.slice(0, 5);

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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-sage-900">
            Halo, {userProfile.displayName} 👋
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl ${balance >= 0 ? 'bg-sage-700' : 'bg-rose-600'} text-white`}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 opacity-70" />
            <span className="text-sm opacity-70 font-body">Saldo Bulan Ini</span>
          </div>
          <div className="font-mono text-2xl font-semibold">{formatRupiah(balance)}</div>
          <div className="text-xs opacity-60 mt-1">{format(now, 'MMMM yyyy', { locale: id })}</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-cream-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-sage-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sage-600" />
            </div>
            <span className="text-sm text-sage-500 font-body">Pemasukan</span>
          </div>
          <div className="font-mono text-xl font-semibold text-sage-800">{formatRupiah(totalIncome)}</div>
          <div className="text-xs text-sage-400 mt-1">{thisMonthTx.filter(t => t.type === 'income').length} transaksi</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-cream-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-sm text-sage-500 font-body">Pengeluaran</span>
          </div>
          <div className="font-mono text-xl font-semibold text-rose-700">{formatRupiah(totalExpense)}</div>
          <div className="text-xs text-sage-400 mt-1">{thisMonthTx.filter(t => t.type === 'expense').length} transaksi</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-cream-200">
          <h3 className="font-display text-lg text-sage-800 mb-4">7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5a845d" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#5a845d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e14f6c" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e14f6c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7da180' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => formatRupiah(v)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="pemasukan" stroke="#5a845d" fill="url(#income)" strokeWidth={2} name="Pemasukan" />
              <Area type="monotone" dataKey="pengeluaran" stroke="#e14f6c" fill="url(#expense)" strokeWidth={2} name="Pengeluaran" />
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
                  <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sage-600">{item.emoji} {item.name}</span>
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
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl p-6 border border-cream-200">
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
            <div className="text-4xl mb-3">📭</div>
            <p>Belum ada transaksi. Mulai catat sekarang!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map(tx => {
              const cat = getCategoryInfo(tx.category);
              return (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-cream-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-cream-100 flex items-center justify-center text-xl flex-shrink-0">
                    {cat.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sage-800 text-sm truncate">
                      {tx.description || cat.label}
                    </div>
                    <div className="text-xs text-sage-400">
                      {format(parseISO(tx.date), 'dd MMM', { locale: id })} · {tx.addedBy}
                    </div>
                  </div>
                  <div className={`font-mono font-semibold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-sage-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
