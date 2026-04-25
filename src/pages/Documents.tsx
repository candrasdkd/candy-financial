import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Upload, FileText, ChevronDown, FolderOpen, Loader2, Filter, X } from 'lucide-react';
import { useDocuments, CATEGORY_INFO, DocCategory, FamilyDocument } from '../hooks/useDocuments';
import { useConfirmStore } from '../store/useConfirmStore';
import { useAuthStore } from '../store/useAuthStore';
import DocumentUploadModal from '../components/DocumentUploadModal';
import DocumentDetailModal from '../components/DocumentDetailModal';

const cv: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const iv: Variants = { 
  hidden: { opacity: 0, y: 20, scale: 0.98 }, 
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 120 } } 
};

const CATS = Object.entries(CATEGORY_INFO) as [DocCategory, typeof CATEGORY_INFO[DocCategory]][];

export default function Documents() {
  const { userProfile } = useAuthStore();
  const { documents, loading, deleteDocument, updateDocument } = useDocuments();
  const { confirm } = useConfirmStore();
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<FamilyDocument | null>(null);
  const [activeCat, setActiveCat] = useState<DocCategory | 'all'>('all');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const filtered = activeCat === 'all' ? documents : documents.filter(d => d.category === activeCat);
  const activeLabel = activeCat === 'all' ? 'Semua Dokumen' : CATEGORY_INFO[activeCat].label;

  const handleDelete = (doc: FamilyDocument) => {
    confirm({
      title: 'Hapus Dokumen?',
      message: `Apakah kamu yakin ingin menghapus "${doc.name}"? File di cloud akan dihapus permanen.`,
      confirmText: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        setSelected(null);
        try {
          await deleteDocument(doc);
        } catch (err: any) {
          alert('Gagal menghapus: ' + err.message);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-sage-300" />
        <p className="text-sm text-sage-400 font-medium">Menyusun brankas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-32">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-display text-sage-900 tracking-tight">Katalog Berkas</h1>
          <p className="text-sage-500 text-sm font-medium">Simpan dan kelola dokumen penting keluarga.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-sage-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-sage-900/20 hover:bg-black transition-all active:scale-95 group"
        >
          <Upload className="w-5 h-5" />
          Upload Dokumen
        </button>
      </section>

      {/* Filter Bar */}
      <section className="bg-white rounded-[1.5rem] p-2 border border-sage-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-10">
        <div className="relative flex-1 md:flex-none">
          <button 
            onClick={() => setShowCatDropdown(!showCatDropdown)}
            className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 px-5 py-3 bg-white border border-sage-100 rounded-2xl text-sm font-bold text-sage-700 shadow-sm hover:border-sage-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-sage-400" />
              <span>Kategori: <span className="text-sage-900 ml-1">{activeLabel}</span></span>
            </div>
            <ChevronDown className={`w-4 h-4 text-sage-300 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showCatDropdown && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setShowCatDropdown(false)} />
                <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }}
                  className="fixed md:absolute bottom-0 md:bottom-auto left-0 md:mt-2 w-full md:w-[480px] bg-white border-t md:border border-sage-100 rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl z-[70] p-6 md:p-8 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-bold text-sage-400 uppercase tracking-[0.15em] ml-1">Pilih Jenis Dokumen</p>
                    <button onClick={() => setShowCatDropdown(false)} className="md:hidden w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
                      <X className="w-4 h-4 text-sage-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
                    <button onClick={() => { setActiveCat('all'); setShowCatDropdown(false); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${activeCat === 'all' ? 'bg-sage-900 border-sage-900 text-white shadow-xl' : 'bg-white border-sage-100 text-sage-600 hover:bg-sage-50'}`}
                    >
                      <div className="text-2xl mb-1">📂</div>
                      <div className="text-[10px] font-bold text-center leading-tight">Semua</div>
                    </button>
                    {CATS.map(([key, info]) => (
                      <button key={key} onClick={() => { setActiveCat(key); setShowCatDropdown(false); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${activeCat === key ? 'bg-sage-900 border-sage-900 text-white shadow-xl' : 'bg-white border-sage-100 text-sage-600 hover:bg-sage-50'}`}
                      >
                        <div className="text-2xl mb-1">{info.emoji}</div>
                        <div className="text-[10px] font-bold text-center leading-tight">{info.label}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 text-xs font-bold text-sage-400 uppercase tracking-widest ml-auto">
          <FolderOpen className="w-3.5 h-3.5" />
          {filtered.length} Berkas
        </div>
      </section>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-dashed border-sage-100 rounded-[3rem] py-20 px-10 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-sage-50 rounded-[2rem] flex items-center justify-center mx-auto border border-white">
            <FolderOpen className="w-8 h-8 text-sage-200" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display text-sage-900">Belum ada dokumen</h3>
            <p className="text-sage-400 max-w-xs mx-auto text-sm leading-relaxed">Simpan dokumen penting keluarga kamu di sini.</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="px-8 py-3 bg-sage-50 text-sage-600 rounded-2xl font-bold hover:bg-sage-100 transition-colors inline-flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </motion.div>
      ) : (
        <motion.div variants={cv} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center">
                <p className="text-sage-300 font-medium italic">Tidak ada dokumen di kategori ini</p>
              </motion.div>
            ) : (
              filtered.map(doc => {
                const info = CATEGORY_INFO[doc.category];
                const safeUrls = doc.imageUrls || [doc.imageUrl!];
                return (
                  <motion.div key={doc.id} variants={iv} layout onClick={() => setSelected(doc)}
                    className="group bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-sage-100 shadow-sm hover:shadow-xl hover:shadow-sage-900/[0.04] transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative h-32 md:h-36 bg-sage-50 overflow-hidden">
                      <img src={safeUrls[0]} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-2 md:top-4 left-2 md:left-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold border bg-white/90 backdrop-blur-sm ${info.color.replace('bg-', 'text-')}`}>
                          {info.emoji} <span className="hidden xs:inline">{info.label}</span>
                        </span>
                      </div>
                      {safeUrls.length > 1 && (
                        <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 bg-black/60 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[9px] text-white font-bold">
                          {safeUrls.length} Pgs
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-5 space-y-2 md:space-y-3">
                      <h3 className="font-bold text-sage-900 text-[11px] md:text-sm line-clamp-1">{doc.name}</h3>
                      <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-sage-50">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 md:w-3.5 h-3 md:h-3.5 text-sage-300" />
                          <span className="text-[8px] md:text-[10px] font-bold text-sage-400 uppercase tracking-widest">{doc.fields?.length || 0} Data</span>
                        </div>
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-sage-50 flex items-center justify-center group-hover:bg-sage-100 transition-colors">
                          <ChevronDown className="w-3 md:w-3.5 h-3 md:h-3.5 -rotate-90 text-sage-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showUpload && <DocumentUploadModal onClose={() => setShowUpload(false)} />}
        {selected && (
          <DocumentDetailModal 
            doc={selected} 
            onClose={() => setSelected(null)} 
            onDelete={() => handleDelete(selected)} 
            onUpdate={updateDocument} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
