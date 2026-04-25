import { AlertTriangle, X, LogOut, UserPlus, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../store/useConfirmStore';

export default function ConfirmModal() {
  const isOpen = useConfirmStore(s => s.isOpen);
  const title = useConfirmStore(s => s.title);
  const message = useConfirmStore(s => s.message);
  const onConfirm = useConfirmStore(s => s.onConfirm);
  const isLoading = useConfirmStore(s => s.isLoading);
  const confirmText = useConfirmStore(s => s.confirmText);
  const variant = useConfirmStore(s => s.variant);
  const close = useConfirmStore(s => s.close);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      color: 'rose',
      bg: 'bg-rose-100',
      text: 'text-rose-500',
      btn: 'bg-rose-600 hover:bg-rose-700'
    },
    info: {
      icon: LogOut,
      color: 'sage',
      bg: 'bg-sage-100',
      text: 'text-sage-600',
      btn: 'bg-sage-700 hover:bg-sage-800'
    },
    success: {
      icon: UserPlus,
      color: 'emerald',
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-sage-900/40 backdrop-blur-sm"
          onClick={close}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${config.text}`} />
            </div>
            <button
              onClick={close}
              disabled={isLoading}
              className="p-2 text-sage-400 hover:bg-cream-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="font-display text-xl text-sage-900 mb-2">{title}</h3>
          <p className="text-sage-500 text-sm mb-8">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={close}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border border-cream-200 text-sage-700 font-medium hover:bg-cream-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={async () => {
                useConfirmStore.getState().setLoading(true);
                try {
                  await onConfirm();
                  close();
                } catch (err) {
                  console.error('Confirm error:', err);
                } finally {
                  useConfirmStore.getState().setLoading(false);
                }
              }}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-xl ${config.btn} text-white font-medium transition-colors disabled:opacity-50 flex justify-center items-center`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
