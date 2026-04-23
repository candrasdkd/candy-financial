import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Coins, BarChart3, Landmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate('/');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email sudah terdaftar'
        : err.message || 'Terjadi kesalahan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sage-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <Heart
              key={i}
              className="absolute fill-cream-100 text-cream-100"
              style={{
                width: `${20 + (i % 4) * 10}px`,
                left: `${(i * 17) % 90}%`,
                top: `${(i * 13) % 90}%`,
                transform: `rotate(${i * 20}deg)`,
              }}
            />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-12">
            <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
            <span className="font-display text-2xl text-cream-100">DuaHati Finance</span>
          </div>
          <h1 className="font-display text-5xl text-cream-100 leading-tight mb-6">
            Langkah awal menuju<br />
            keuangan yang <em className="text-sage-400">harmonis</em>
          </h1>
          <p className="text-sage-300 text-lg leading-relaxed">
            Catat, pantau, dan rencanakan keuangan rumah tangga bersama dalam satu aplikasi yang transparan dan mudah digunakan.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.4 } }
          }}
          className="relative grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Pemasukan', icon: Coins },
            { label: 'Pengeluaran', icon: BarChart3 },
            { label: 'Anggaran', icon: Landmark },
          ].map(item => (
            <motion.div 
              key={item.label} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
              } as const}
              className="bg-sage-800/50 rounded-2xl p-4 text-center"
            >
              <item.icon className="w-8 h-8 mx-auto mb-2 text-cream-200" />
              <div className="text-cream-300 text-sm font-body">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-cream-50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="font-display text-xl text-sage-800">DuaHati Finance</span>
          </div>

          <h2 className="font-display text-3xl text-sage-900 mb-2">Buat akun baru</h2>
          <p className="text-sage-500 font-body mb-8">Mulai kelola keuangan bersama pasangan</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-sage-500 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Nama kamu"
                required
                className="w-full px-4 py-3.5 border-2 border-cream-200 rounded-2xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sage-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3.5 border-2 border-cream-200 rounded-2xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sage-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full px-4 py-3.5 border-2 border-cream-200 rounded-2xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sage-500 uppercase tracking-wider mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Ulangi password"
                required
                className="w-full px-4 py-3.5 border-2 border-cream-200 rounded-2xl text-sage-900 focus:outline-none focus:border-sage-400 transition-colors bg-white"
              />
            </div>

            {error && (
              <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-sage-700 hover:bg-sage-800 text-cream-100 rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="text-center text-sage-500 mt-6 font-body">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-sage-700 font-semibold hover:underline">
              Masuk
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
