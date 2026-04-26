import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Smartphone, Shield, WifiOff, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePWAStore, getInstallDismissed, setInstallDismissed } from '../store/usePWAStore';

const FEATURES = [
  { icon: Zap, label: 'Akses Instan', desc: 'Buka langsung dari Home Screen tanpa browser' },
  { icon: WifiOff, label: 'Mode Offline', desc: 'Lihat data keuangan meski tanpa internet' },
  { icon: Shield, label: 'Data Aman', desc: 'Tersimpan aman dengan enkripsi Firebase' },
  { icon: Smartphone, label: 'Terasa Native', desc: 'Tampilan fullscreen tanpa URL bar' },
];

const SCREENSHOTS = [
  { src: '/screenshot1.png', label: 'Dashboard' },
  { src: '/screenshot2.png', label: 'Dokumen' },
];

export default function InstallPrompt() {
  const { deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled } = usePWAStore();
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(() => !getInstallDismissed());
  const [activeShot, setActiveShot] = useState(0);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || window.navigator.vendor || (window as any).opera;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setIsInstalled]);

  if (isInstalled || !isVisible) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setInstallDismissed();
    setIsVisible(false);
  };

  const prevShot = () => setActiveShot(s => (s - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  const nextShot = () => setActiveShot(s => (s + 1) % SCREENSHOTS.length);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm md:hidden"
          />

          {/* Bottom Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[160] md:hidden"
          >
            <div className="bg-white rounded-t-[2rem] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] overflow-hidden max-h-[92dvh] flex flex-col">

              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-sage-200" />
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto">

                {/* Header */}
                <div className="px-6 pt-4 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-sage-100 shrink-0">
                      <img src="/logo.png" alt="CandyNest" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display text-sage-900 leading-tight">CandyNest</h2>
                      <p className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">Family Hub</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-3 h-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                        <span className="text-[10px] text-sage-400 font-medium ml-1">Gratis</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center text-sage-500 hover:bg-sage-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Screenshot Carousel */}
                <div className="px-6 mb-5">
                  <div className="relative rounded-2xl overflow-hidden bg-sage-50 border border-sage-100 aspect-[9/16] max-h-56">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeShot}
                        src={SCREENSHOTS[activeShot].src}
                        alt={SCREENSHOTS[activeShot].label}
                        className="w-full h-full object-cover object-top"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      />
                    </AnimatePresence>

                    {/* Nav arrows */}
                    <button onClick={prevShot} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextShot} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Label badge */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full">
                      <p className="text-[10px] font-bold text-white uppercase tracking-widest">{SCREENSHOTS[activeShot].label}</p>
                    </div>
                  </div>

                  {/* Dots */}
                  <div className="flex justify-center gap-1.5 mt-3">
                    {SCREENSHOTS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveShot(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === activeShot ? 'w-6 bg-sage-800' : 'w-1.5 bg-sage-200'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 mb-5">
                  <p className="text-[10px] font-black text-sage-400 uppercase tracking-[0.2em] mb-3">Kenapa Install?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FEATURES.map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="bg-sage-50 border border-sage-100 rounded-2xl p-3.5 flex flex-col gap-2">
                        <div className="w-8 h-8 bg-sage-900 rounded-xl flex items-center justify-center">
                          <Icon className="w-4 h-4 text-rose-300" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-sage-900 leading-tight">{label}</p>
                          <p className="text-[10px] text-sage-400 leading-tight mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* iOS Manual Instructions */}
                {isIOS && (
                  <div className="mx-6 mb-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <Share className="w-3.5 h-3.5" /> Cara Install di iOS
                    </p>
                    <ol className="text-[11px] text-blue-600 space-y-1 list-none">
                      <li>1. Tap ikon <Share className="inline w-3 h-3 mx-0.5" /> di toolbar bawah Safari</li>
                      <li>2. Scroll dan pilih <strong>"Add to Home Screen"</strong></li>
                      <li>3. Tap <strong>"Add"</strong> di sudut kanan atas</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* CTA Footer — sticky */}
              <div className="px-6 pt-4 pb-8 shrink-0 border-t border-sage-50 bg-white">
                {!isIOS && deferredPrompt ? (
                  <motion.button
                    onClick={handleInstallClick}
                    disabled={installing}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 bg-sage-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-sage-900/25 disabled:opacity-70 transition-all relative overflow-hidden"
                  >
                    {installing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Menginstall...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Install Gratis — Sekarang
                      </>
                    )}
                  </motion.button>
                ) : !isIOS ? (
                  <div className="text-center text-xs text-sage-400 font-medium py-2">
                    Buka menu browser <strong className="text-sage-600">(⋮)</strong> → <strong className="text-sage-600">Install app</strong>
                  </div>
                ) : null}

                <p className="text-center text-[10px] text-sage-300 mt-3">
                  Gratis selamanya · Tidak ada iklan · Data pribadi aman
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
