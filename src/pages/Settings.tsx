import { useState } from 'react';
import { Copy, Link2, Heart, User, Mail, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { userProfile, linkCouple } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (userProfile?.inviteCode) {
      navigator.clipboard.writeText(userProfile.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    if (!inviteCode.trim()) return;
    setLinking(true);
    try {
      await linkCouple(inviteCode.toUpperCase().trim());
      setLinkSuccess('Berhasil terhubung dengan pasangan! 💑');
      setInviteCode('');
    } catch (err: any) {
      setLinkError(err.message || 'Terjadi kesalahan');
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl lg:text-3xl text-sage-900">Pengaturan</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6">
        <h2 className="font-display text-lg text-sage-800 mb-5">Profil Saya</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-display text-sage-700">
                {userProfile?.displayName?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-sage-800">{userProfile?.displayName}</div>
              <div className="text-sage-500 text-sm">{userProfile?.email}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Couple Status */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6">
        <h2 className="font-display text-lg text-sage-800 mb-5 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
          Status Pasangan
        </h2>

        {userProfile?.coupleId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-sage-50 rounded-2xl border border-sage-200">
              <CheckCircle className="w-5 h-5 text-sage-600" />
              <div>
                <div className="font-medium text-sage-800">Terhubung dengan pasangan</div>
                <div className="text-sm text-sage-500">{userProfile.partnerEmail}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* My invite code */}
            <div>
              <div className="text-sm font-semibold text-sage-600 mb-2">Kode Undanganmu</div>
              <p className="text-xs text-sage-400 mb-3">
                Bagikan kode ini ke pasanganmu untuk terhubung.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-5 py-3.5 bg-cream-50 border-2 border-cream-200 rounded-2xl font-mono text-2xl text-center tracking-widest font-bold text-sage-800">
                  {userProfile?.inviteCode}
                </div>
                <button
                  onClick={copyCode}
                  className="px-4 py-3.5 bg-sage-100 hover:bg-sage-200 text-sage-700 rounded-2xl transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-sage-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Disalin!' : 'Salin'}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-sage-400 uppercase tracking-wider">atau</span>
              </div>
            </div>

            {/* Enter partner code */}
            <div>
              <div className="text-sm font-semibold text-sage-600 mb-2">Masukkan Kode Pasangan</div>
              <p className="text-xs text-sage-400 mb-3">
                Minta kode undangan dari pasanganmu dan masukkan di sini.
              </p>
              <form onSubmit={handleLink} className="flex gap-3">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="flex-1 px-5 py-3.5 border-2 border-cream-200 rounded-2xl font-mono text-xl text-center tracking-widest text-sage-900 focus:outline-none focus:border-sage-400 transition-colors uppercase"
                />
                <button
                  type="submit"
                  disabled={linking || inviteCode.length < 6}
                  className="px-5 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Link2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Hubungkan</span>
                </button>
              </form>

              {linkError && (
                <div className="mt-3 text-rose-600 text-sm bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">
                  {linkError}
                </div>
              )}
              {linkSuccess && (
                <div className="mt-3 text-sage-700 text-sm bg-sage-50 border border-sage-200 px-4 py-3 rounded-xl">
                  {linkSuccess}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-cream-50 rounded-3xl border border-cream-200 p-6">
        <h2 className="font-display text-lg text-sage-800 mb-3">Tentang Aplikasi</h2>
        <div className="space-y-2 text-sm text-sage-500">
          <div className="flex justify-between">
            <span>Versi</span>
            <span className="font-mono text-sage-700">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Dibuat dengan</span>
            <span className="text-sage-700">❤️ React + Firebase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
