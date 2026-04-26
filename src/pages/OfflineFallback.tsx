import { motion } from 'framer-motion';
import { WifiOff, Home, RefreshCw } from 'lucide-react';

export default function OfflineFallback() {
  return (
    <div className="min-h-screen bg-sage-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-8 border border-sage-100"
      >
        <WifiOff className="w-10 h-10 text-rose-400" />
      </motion.div>
      
      <h1 className="font-display text-3xl text-sage-900 mb-3">Sedang Offline</h1>
      <p className="text-sage-500 max-w-xs mb-10 leading-relaxed font-medium">
        Koneksi internet terputus. Tenang, kamu tetap bisa melihat data yang sudah tersimpan sebelumnya!
      </p>

      <div className="flex flex-col w-full max-w-xs gap-3">
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-3 py-4 bg-sage-800 text-white rounded-2xl font-bold shadow-lg shadow-sage-900/20 active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Coba Hubungkan Lagi
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center justify-center gap-3 py-4 bg-white text-sage-600 rounded-2xl font-bold border border-sage-100 active:scale-95 transition-all"
        >
          <Home className="w-4 h-4" />
          Buka Dashboard
        </button>
      </div>

      <p className="mt-12 text-[10px] font-bold text-sage-300 uppercase tracking-[0.3em]">CandyNest Offline Mode</p>
    </div>
  );
}
