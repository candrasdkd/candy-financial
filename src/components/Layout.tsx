import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Settings,
  LogOut,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { to: '/budget', icon: PiggyBank, label: 'Anggaran' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-sage-900 text-cream-100">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-sage-700">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
          <span className="font-display text-xl text-cream-100">DuaHati</span>
        </div>
        <p className="text-sage-400 text-xs mt-1 font-body">Finance</p>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-sage-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sage-600 flex items-center justify-center">
            <span className="text-cream-100 font-body font-semibold text-sm">
              {userProfile?.displayName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-cream-200 font-body font-medium text-sm">{userProfile?.displayName}</p>
            {userProfile?.partnerEmail && (
              <p className="text-sage-400 text-xs flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                {userProfile.partnerEmail.split('@')[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-sage-600 text-cream-100 shadow-sm'
                  : 'text-sage-300 hover:bg-sage-800 hover:text-cream-200'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-sage-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-sage-300 hover:bg-sage-800 hover:text-rose-400 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-cream-50 font-body overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-60 lg:w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-cream-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-cream-100">
            <Menu className="w-5 h-5 text-sage-700" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <span className="font-display text-lg text-sage-800">DuaHati</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
