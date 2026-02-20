import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Email atau password salah'
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

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
            <span className="font-display text-2xl text-cream-100">DuaHati Finance</span>
          </div>
          <h1 className="font-display text-5xl text-cream-100 leading-tight mb-6">
            Kelola keuangan<br />
            <em className="text-sage-400">bersama</em> pasangan
          </h1>
          <p className="text-sage-300 text-lg leading-relaxed">
            Transparansi finansial untuk hubungan yang lebih harmonis.
            Catat, pantau, dan rencanakan keuangan rumah tangga bersama.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: 'Pemasukan', emoji: '💰' },
            { label: 'Pengeluaran', emoji: '📊' },
            { label: 'Anggaran', emoji: '🏦' },
          ].map(item => (
            <div key={item.label} className="bg-sage-800/50 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="text-cream-300 text-sm font-body">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-cream-50">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="font-display text-xl text-sage-800">DuaHati Finance</span>
          </div>

          <h2 className="font-display text-3xl text-sage-900 mb-2">Selamat datang</h2>
          <p className="text-sage-500 font-body mb-8">Masuk ke akun Anda</p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="••••••••"
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
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-sage-500 mt-6 font-body">
            Belum punya akun?{' '}
            <Link to="/register" className="text-sage-700 font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
