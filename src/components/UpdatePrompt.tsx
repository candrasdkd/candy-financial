// src/components/UpdatePrompt.tsx
import { useState, useRef, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';

const UPDATE_COOLDOWN_KEY = 'pwa_last_updated';

export default function UpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const hasReloaded = useRef(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Naikan interval — 5 menit cukup, tidak perlu 60 detik
    intervalRef.current = setInterval(() => {
      swRegistrationRef.current?.update();
    }, 5 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
    onRegistered(r) {
      if (r) {
        swRegistrationRef.current = r;
      }
    },
  });

  // Cek cooldown — jangan tampil kalau baru saja update (dalam 10 detik)
  const lastUpdated = localStorage.getItem(UPDATE_COOLDOWN_KEY);
  const justUpdated = lastUpdated && Date.now() - Number(lastUpdated) < 10_000;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // Catat waktu update untuk cooldown
      localStorage.setItem(UPDATE_COOLDOWN_KEY, String(Date.now()));
      
      // Panggil updateServiceWorker(true) yang akan mengirim SKIP_WAITING
      // dan mencoba reload otomatis via vite-plugin-pwa logic.
      const updatePromise = updateServiceWorker(true);

      // Safety timeout: Jika dalam 2 detik tidak reload otomatis, kita paksa reload.
      // Ini sering terjadi jika event controllerchange tidak tertangkap.
      const safetyTimeout = setTimeout(() => {
        console.log('Force reloading after timeout...');
        window.location.reload();
      }, 2000);

      await updatePromise;
      clearTimeout(safetyTimeout);
      window.location.reload();
    } catch (error) {
      console.error('Failed to update service worker:', error);
      // Jika gagal pun, coba reload saja untuk reset state
      window.location.reload();
    }
  };

  // Jangan tampil kalau baru saja reload dari update
  if (justUpdated) return null;

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm">
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="bg-sage-900 text-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <RefreshCw className={`w-6 h-6 text-rose-300 ${isUpdating ? 'animate-spin' : ''}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="w-3 h-3 text-rose-400 fill-rose-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">
                  {needRefresh ? 'Update Tersedia' : 'Siap Offline'}
                </p>
              </div>
              <p className="text-xs font-bold text-white/90 leading-snug">
                {needRefresh
                  ? 'CandyNest punya fitur baru! Yuk perbarui aplikasimu.'
                  : 'Aplikasi siap digunakan secara offline!'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {needRefresh && (
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-white text-sage-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              )}
              <button
                onClick={close}
                className="p-2 text-white/40 hover:text-white transition-colors self-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}