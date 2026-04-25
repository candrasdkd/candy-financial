import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ShieldCheck, ChevronRight, X, Puzzle } from 'lucide-react';

interface PuzzleCaptchaProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function PuzzleCaptcha({ onSuccess, onClose }: PuzzleCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const handleDragEnd = (event: any, info: any) => {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.offsetWidth;
    const thumbWidth = 56; // w-14 = 56px
    const threshold = trackWidth - thumbWidth - 20;
    
    if (info.offset.x >= threshold) {
      setIsVerified(true);
      controls.start({ x: trackWidth - thumbWidth - 8 });
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-sage-950/60 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-sage-900 border border-white/10 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-cream-50">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Puzzle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="font-display text-lg">Verifikasi Keamanan</h3>
              <p className="text-[10px] text-sage-400 uppercase tracking-widest font-bold">Anti-Bot Check</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-sage-400 hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sage-300 text-sm font-medium mb-6 text-center">Geser puzzle ke kanan untuk membuktikan kamu bukan robot.</p>
          
          <div ref={trackRef} className="h-16 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden flex items-center">
             <div className="absolute inset-0 flex items-center justify-center text-sage-500 font-bold text-xs uppercase tracking-widest pointer-events-none">
               {isVerified ? '' : 'Geser ke kanan'}
             </div>
             
             {isVerified && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center z-10 text-emerald-400 font-bold gap-2">
                 <ShieldCheck className="w-5 h-5" /> Terverifikasi
               </motion.div>
             )}

             <motion.div 
               drag={!isVerified ? "x" : false}
               dragConstraints={trackRef}
               dragElastic={0}
               dragMomentum={false}
               onDragEnd={handleDragEnd}
               animate={controls}
               className={`absolute left-1 w-14 h-14 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing z-20 ${isVerified ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-lg'}`}
             >
               {isVerified ? <ShieldCheck className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
             </motion.div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
