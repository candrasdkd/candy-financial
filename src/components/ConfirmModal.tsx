import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sage-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <button
            onClick={onCancel}
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
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-cream-200 text-sage-700 font-medium hover:bg-cream-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Hapus'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
