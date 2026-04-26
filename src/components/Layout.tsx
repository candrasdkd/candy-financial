import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Heart,
  Menu,
  X,
  User,
  WifiOff,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { to: '/budget', icon: PiggyBank, label: 'Anggaran' },
  { to: '/savings', icon: Wallet, label: 'Pos' },
  { to: '/documents', icon: FileText, label: 'Dokumen' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { confirm, close } = useConfirmStore();
  const { isOnline } = useNetworkStatus();

  async function handleLogout() {
    confirm({
      title: 'Keluar Aplikasi',
      message: 'Apakah Anda yakin ingin keluar dari akun?',
      confirmText: 'Keluar',
      variant: 'danger',
      onConfirm: async () => {
        await logout();
        close();
        navigate('/login');
      }
    });
  }

  const DesktopSidebar = () => (
    <aside className="flex flex-col h-full bg-sage-900 text-cream-100 shadow-[8px_0_32px_rgba(0,0,0,0.1)]">
      {/* Logo */}
      <div className="px-8 py-12 border-b border-sage-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-lg shadow-black/20 overflow-hidden">
            <img src="/logo.png" alt="CandyNest Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-xl tracking-tight text-white leading-none">CandyNest</h1>
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mt-1">Family Hub</p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="px-4 py-6 border-b border-sage-800">
        <div className="p-4 rounded-[1.5rem] bg-sage-800/40 border border-sage-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-sage-800 border border-sage-700">
            <img
              src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${userProfile?.displayName || 'user'}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{userProfile?.displayName}</p>
            <p className="text-sage-400 text-[10px] font-bold uppercase tracking-wider">Online</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 relative group ${isActive
                ? 'text-white'
                : 'text-sage-400 hover:text-white hover:bg-sage-800/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-sage-800 rounded-2xl border border-sage-700 -z-10 shadow-lg shadow-black/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-rose-400' : 'text-sage-500 group-hover:text-sage-300'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-sage-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm text-sage-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Keluar
        </button>
      </div>
    </aside>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl border-t border-sage-100 px-2 flex items-center justify-around z-[100] pb-safe">
      {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-1.5 relative group min-w-[52px]"
          >
            <div className={`p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-sage-900 text-white shadow-lg shadow-sage-900/20' : 'text-sage-300'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-sage-900' : 'text-sage-300'}`}>
              {label === 'Dashboard' ? 'Home' : label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-sage-50/30 font-body overflow-hidden">
      {/* Desktop Sidebar & Mobile Drawer Overlay */}
      <div className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0">
        <DesktopSidebar />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[110] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
              className="absolute left-0 top-0 bottom-0 w-72"
            >
              <DesktopSidebar />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden h-16 bg-white border-b border-sage-100 px-6 flex items-center justify-between sticky top-0 z-[90]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <span className="font-display text-lg text-sage-900">CandyNest</span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center border border-sage-100 overflow-hidden"
          >
            <img
              src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${userProfile?.displayName || 'user'}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </button>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          {/* Offline Banner */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="bg-rose-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold">
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Kamu sedang offline — data baru tidak akan tersimpan</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
