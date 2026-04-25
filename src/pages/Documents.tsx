import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Upload, FileText, ChevronDown, FolderOpen, Loader2, Filter, X, CheckCircle2, Download, User } from 'lucide-react';
import { useDocuments, CATEGORY_INFO, DocCategory, FamilyDocument } from '../hooks/useDocuments';
import { useConfirmStore } from '../store/useConfirmStore';
import { useAuthStore } from '../store/useAuthStore';
import DocumentUploadModal from '../components/DocumentUploadModal';
import DocumentDetailModal from '../components/DocumentDetailModal';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
  const [activePartner, setActivePartner] = useState<string | 'all'>('all');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // Selection States
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Daftar partner unik yang punya dokumen
  const partners = Array.from(new Set(documents.map(d => d.uploadedBy).filter(Boolean)));

  const filtered = documents.filter(d => {
    const catOk = activeCat === 'all' || d.category === activeCat;
    const partnerOk = activePartner === 'all' || d.uploadedBy === activePartner;
    return catOk && partnerOk;
  });
  const activeLabel = activeCat === 'all' ? 'Semua Dokumen' : CATEGORY_INFO[activeCat].label;

  // Inisial nama untuk avatar
  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const toggleDocSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    console.log('Starting export for:', selectedIds);

    try {
      const doc = new jsPDF();
      const docsToExport = documents.filter(d => selectedIds.includes(d.id));
      let pageAdded = false;

      for (const item of docsToExport) {
        const urls = item.imageUrls || [item.imageUrl!];

        for (const imgUrl of urls) {
          if (!imgUrl) continue;

          try {
            const dataUrl = await getBase64Image(imgUrl);
            const imgProps = doc.getImageProperties(dataUrl);
            
            // SMART DETECT: Wide -> Landscape, Tall -> Portrait
            const imgOrientation = imgProps.width > imgProps.height ? 'l' : 'p';
            
            if (!pageAdded) {
              doc.deletePage(1);
              doc.addPage(undefined, imgOrientation);
            } else {
              doc.addPage(undefined, imgOrientation);
            }

            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = doc.internal.pageSize.getHeight();
            const imgAspect = imgProps.width / imgProps.height;
            const pdfAspect = pdfWidth / pdfHeight;

            let finalWidth, finalHeight;
            if (imgAspect > pdfAspect) {
              finalWidth = pdfWidth - 20;
              finalHeight = finalWidth / imgAspect;
            } else {
              finalHeight = pdfHeight - 20;
              finalWidth = finalHeight * imgAspect;
            }

            doc.addImage(dataUrl, 'JPEG', (pdfWidth - finalWidth) / 2, (pdfHeight - finalHeight) / 2, finalWidth, finalHeight);
            pageAdded = true;
          } catch (e) {
            console.error('Gagal memuat gambar:', imgUrl, e);
          }
        }
      }

      if (!pageAdded) {
        throw new Error('Tidak ada gambar yang berhasil dimuat.');
      }

      doc.save(`CandyNest_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      setSelectedIds([]);
      setIsSelectMode(false);
    } catch (err: any) {
      console.error('Export Error:', err);
      alert('Gagal export PDF: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getBase64Image = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDelete = (doc: FamilyDocument) => {
    confirm({
      title: 'Hapus Dokumen?',
      message: `Apakah kamu yakin ingin menghapus "${doc.name}"? File di cloud akan dihapus permanen.`,
      confirmText: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDocument(doc);
          setSelected(null);
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedIds([]);
            }}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-[1.5rem] font-bold transition-all active:scale-95 border ${isSelectMode ? 'bg-sage-100 border-sage-200 text-sage-700' : 'bg-white border-sage-100 text-sage-600'}`}
          >
            {isSelectMode ? <X className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {isSelectMode ? 'Batal' : 'Pilih Berkas'}
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-sage-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-sage-900/20 hover:bg-black transition-all active:scale-95 group"
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>
        </div>
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
                  className="fixed inset-0 bg-sage-950/60 backdrop-blur-md z-[150]" onClick={() => setShowCatDropdown(false)} />
                <div className="fixed inset-0 flex items-end md:items-center justify-center z-[160] pointer-events-none pb-0 md:p-4">
                  <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }}
                    className="w-full md:w-[480px] bg-white border-t md:border border-sage-100 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl p-6 pb-10 md:pb-8 md:p-8 overflow-hidden max-h-[85vh] flex flex-col pointer-events-auto"
                  >
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <p className="text-[10px] font-bold text-sage-400 uppercase tracking-[0.15em] ml-1">Pilih Jenis Dokumen</p>
                    <button onClick={() => setShowCatDropdown(false)} className="md:hidden w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center">
                      <X className="w-4 h-4 text-sage-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4 overflow-y-auto pr-1 scrollbar-hide flex-1">
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
                </div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Partner Filter Pills */}
        {partners.length > 1 && (
          <div className="flex items-center gap-2 px-2 md:px-0 flex-wrap">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-sage-400 uppercase tracking-widest">
              <User className="w-3 h-3" />
              <span className="hidden md:inline">Pemilik</span>
            </div>
            <button
              onClick={() => setActivePartner('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                activePartner === 'all'
                  ? 'bg-sage-900 text-white border-sage-900 shadow-sm'
                  : 'bg-white text-sage-500 border-sage-100 hover:border-sage-200'
              }`}
            >
              Semua
            </button>
            {partners.map(name => (
              <button
                key={name}
                onClick={() => setActivePartner(activePartner === name ? 'all' : name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                  activePartner === name
                    ? 'bg-sage-900 text-white border-sage-900 shadow-sm'
                    : 'bg-white text-sage-600 border-sage-100 hover:border-sage-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black ${
                  activePartner === name ? 'bg-white/20' : 'bg-sage-100'
                }`}>
                  {getInitials(name)}
                </div>
                <span className="max-w-[80px] truncate">{name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}

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
        <motion.div variants={cv} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 relative">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center">
                <p className="text-sage-300 font-medium italic">Tidak ada dokumen di kategori ini</p>
              </motion.div>
            ) : (
              filtered.map(doc => {
                const info = CATEGORY_INFO[doc.category];
                const safeUrls = doc.imageUrls || [doc.imageUrl!];
                const isSelected = selectedIds.includes(doc.id);

                return (
                  <motion.div
                    key={doc.id}
                    variants={iv}
                    layout
                    onClick={() => {
                      if (isSelectMode) {
                        toggleDocSelection(doc.id);
                      } else {
                        setSelected(doc);
                      }
                    }}
                    className={`group bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border transition-all duration-300 cursor-pointer relative ${isSelected ? 'border-sage-900 shadow-xl shadow-sage-900/10 scale-[1.02]' : 'border-sage-100 shadow-sm hover:shadow-xl hover:shadow-sage-900/[0.04]'}`}
                  >
                    <div className="relative h-32 md:h-36 bg-sage-50 overflow-hidden">
                      <img src={safeUrls[0]} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />

                      {/* Selection Overlay */}
                      <div className={`absolute inset-0 bg-sage-900/10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />

                      {/* Select Indicator */}
                      {isSelectMode && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-sage-900 border-sage-900 text-white' : 'bg-white/50 backdrop-blur-md border-white'}`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      )}

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
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Floating Export Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: window.innerWidth < 768 ? '-50%' : 0 }}
            animate={{ y: 0, opacity: 1, x: window.innerWidth < 768 ? '-50%' : 0 }}
            exit={{ y: 100, opacity: 0, x: window.innerWidth < 768 ? '-50%' : 0 }}
            className="fixed bottom-24 left-1/2 md:left-auto md:right-5 -translate-x-1/2 md:translate-x-0 w-fit min-w-[280px] md:min-w-[420px] bg-sage-900 text-white rounded-full p-2 md:p-3 shadow-2xl z-[100] flex items-center gap-4 md:gap-10 border border-white/10"
          >
            <div className="flex items-center gap-2 md:gap-4 pl-1">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sage-300 flex-shrink-0 text-sm">
                {selectedIds.length}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-bold truncate">Berkas Terpilih</p>
                <p className="hidden lg:block text-[10px] text-sage-400 uppercase tracking-widest">Siap digabung</p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto pr-1">
              <button
                onClick={() => { setSelectedIds([]); setIsSelectMode(false); }}
                className="px-3 py-2 text-xs font-bold text-sage-400 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center justify-center w-10 h-10 md:w-auto md:px-8 md:h-12 bg-white text-sage-900 rounded-full font-black shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-5 h-5 md:w-4 md:h-4" />}
                <span className="hidden md:inline ml-2">{isExporting ? 'Memproses...' : 'Export PDF'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
