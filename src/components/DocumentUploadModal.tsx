import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImageIcon, Loader2, ScanLine, Check, Copy, AlertCircle, Sparkles } from 'lucide-react';
import { useDocuments, CATEGORY_INFO, FIELD_TEMPLATES, OcrField, DocCategory } from '../hooks/useDocuments';
import { formatFileSize } from '../utils/document';

type Step = 'select' | 'processing' | 'review';
const CATS = Object.entries(CATEGORY_INFO) as [DocCategory, typeof CATEGORY_INFO[DocCategory]][];

export default function DocumentUploadModal({ onClose }: { onClose: () => void }) {
  const { compress, scanDocument, uploadAndSave, uploading, uploadProgress, ocrLoading, error: hookError } = useDocuments();

  const [step, setStep] = useState<Step>('select');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [category, setCategory] = useState<DocCategory>('ktp');
  const [customName, setCustomName] = useState('');
  const [fields, setFields] = useState<OcrField[]>([]);
  const [scanData, setScanData] = useState<{ rawText: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [shouldScan, setShouldScan] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setLocalError(null);
    if (f.size < 100 * 1024) {
      setLocalError('File terlalu kecil! Minimal 100KB agar teks terbaca jelas.');
      return;
    }
    
    let processedFile = f;
    if (f.size > 500 * 1024) {
      setIsCompressing(true);
      try {
        processedFile = await compress(f);
      } catch (err) {
        setLocalError('Gagal mengompres file.');
        return;
      } finally {
        setIsCompressing(false);
      }
    }

    setFiles(prev => [...prev, processedFile]);
    setPreviews(prev => [...prev, URL.createObjectURL(processedFile)]);
  };

  const handleScan = async () => {
    if (files.length === 0) return;
    
    if (!shouldScan) {
      const templates = FIELD_TEMPLATES[category];
      setFields(templates.map(label => ({ label, value: '' })));
      setScanData(null);
      setStep('review');
      return;
    }

    setStep('processing');
    try {
      const result = await scanDocument(files, category);
      const templates = FIELD_TEMPLATES[category];
      const merged: OcrField[] = templates.length
        ? templates.map(label => ({ label, value: result.fields.find(f => f.label === label)?.value ?? '' }))
        : result.fields;
      setFields(merged.length ? merged : [{ label: 'Teks', value: result.rawText }]);
      setScanData({ rawText: result.rawText });
      setStep('review');
    } catch {
      setStep('select');
    }
  };

  const handleSave = async () => {
    if (files.length === 0 || !fields) return;
    setSaving(true);
    try {
      await uploadAndSave({
        files,
        name: customName || `${CATEGORY_INFO[category].label} — ${new Date().toLocaleDateString('id-ID')}`,
        category,
        fields,
        rawText: scanData?.rawText || '',
      });
      setDone(true);
      setTimeout(onClose, 1000);
    } catch {
      setSaving(false);
    }
  };

  const error = localError || hookError;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end sm:justify-center sm:items-center overflow-hidden">
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-sage-950/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden border border-white/20 mt-auto sm:my-auto"
      >
        {/* Header (Sticky) */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-sage-50 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-rose-400">
                <Sparkles className="w-3 h-3 fill-rose-400" />
                <span className="text-[9px] font-bold uppercase tracking-[0.3em]">
                  {step === 'select' ? 'Unggah Berkas' : step === 'processing' ? 'Proses Scan' : 'Verifikasi Data'}
                </span>
              </div>
              <h2 className="font-display text-2xl text-sage-900 tracking-tight leading-none">
                {step === 'select' ? 'Tambah Dokumen' : step === 'processing' ? 'Menganalisis...' : 'Simpan Dokumen'}
              </h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-sage-50 text-sage-400 hover:bg-sage-100 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-1 mt-4">
            {(['select', 'processing', 'review'] as Step[]).map((s, i) => (
              <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-sage-700' : (['select', 'processing', 'review'] as Step[]).indexOf(step) > i ? 'w-4 bg-sage-400' : 'w-4 bg-sage-100'}`} />
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <label className="text-[9px] font-bold text-sage-400 uppercase tracking-widest mb-3 block px-1">Jenis Dokumen</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATS.map(([key, info]) => (
                      <button key={key} onClick={() => setCategory(key)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 ${category === key ? 'bg-sage-50 border-sage-200 text-sage-900 shadow-sm' : 'border-sage-50 text-sage-300 hover:border-sage-100'}`}>
                        <div className="text-xl mb-0.5">{info.emoji}</div>
                        <div className="text-[8px] font-bold uppercase leading-tight text-center truncate w-full">{info.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-sage-400 uppercase tracking-widest mb-3 block px-1">Nama Dokumen (Opsional)</label>
                  <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder={`${CATEGORY_INFO[category].label} — ${new Date().toLocaleDateString('id-ID')}`}
                    className="w-full px-5 py-4 bg-sage-50 border border-sage-100 rounded-2xl text-sage-900 focus:outline-none transition-all font-bold text-sm" />
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-sage-400 uppercase tracking-widest mb-3 block px-1">Foto Dokumen</label>
                  <div className="grid grid-cols-2 gap-3">
                    {previews.map((url, i) => (
                      <div key={i} className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-sage-100 bg-sage-50">
                        <img src={url} className="w-full h-full object-cover" />
                        <button onClick={() => { setFiles(f => f.filter((_, idx) => idx !== i)); setPreviews(p => p.filter((_, idx) => idx !== i)); }}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => inputRef.current?.click()} disabled={isCompressing}
                      className="aspect-[4/3] rounded-2xl border-2 border-dashed border-sage-200 flex flex-col items-center justify-center gap-2 text-sage-400 hover:bg-sage-50 transition-all">
                      {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">Tambah Foto</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 text-xs font-bold leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                <div className="p-4 rounded-3xl bg-sage-50/50 border border-sage-100 flex items-center justify-between group cursor-pointer" onClick={() => setShouldScan(!shouldScan)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${shouldScan ? 'bg-sage-900 text-white shadow-lg' : 'bg-white text-sage-300 border border-sage-100'}`}>
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sage-900">Scan & Ekstrak Data</p>
                      <p className="text-[10px] text-sage-400 font-medium">{shouldScan ? 'Baca teks otomatis' : 'Hanya simpan foto'}</p>
                    </div>
                  </div>
                  <button className={`w-10 h-6 rounded-full relative transition-all ${shouldScan ? 'bg-sage-900' : 'bg-sage-200'}`}>
                    <motion.div animate={{ x: shouldScan ? 18 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div key="processing" className="py-20 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 rounded-full border-4 border-dashed border-sage-200" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-10 h-10 text-sage-900 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-display text-xl text-sage-900 mb-2">Menganalisis Dokumen</h3>
                  <p className="text-sm text-sage-400 font-medium">Mesin AI sedang membaca teks dokumen kamu...</p>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-sage-400 uppercase tracking-widest px-1">Review Hasil Scan</label>
                  <div className="space-y-3">
                    {fields.map((f, i) => (
                      <div key={i} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-sage-400 uppercase tracking-wider px-1 ml-1">{f.label}</label>
                        <input type="text" value={f.value} onChange={e => {
                          const n = [...fields]; n[i].value = e.target.value; setFields(n);
                        }} className="w-full px-5 py-3.5 bg-sage-50 border border-sage-100 rounded-xl text-sage-900 font-bold text-sm focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer (Sticky) */}
        <div className="flex-shrink-0 p-6 pb-12 sm:pb-6 border-t border-sage-50 bg-white">
          {step === 'select' ? (
            <button disabled={files.length === 0 || isCompressing} onClick={handleScan}
              className="w-full py-4 bg-sage-900 text-white rounded-2xl font-bold shadow-xl shadow-sage-900/20 hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {shouldScan ? <><ScanLine className="w-4 h-4" /> Analisis Dokumen</> : <><ImageIcon className="w-4 h-4" /> Lanjut Simpan Foto</>}
            </button>
          ) : step === 'review' ? (
            <button disabled={saving} onClick={handleSave}
              className="w-full py-4 bg-sage-900 text-white rounded-2xl font-bold shadow-xl shadow-sage-900/20 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {saving ? 'Menyimpan...' : 'Simpan Sekarang'}
            </button>
          ) : null}
        </div>
        
        <input type="file" ref={inputRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </motion.div>
    </div>
  );
}
