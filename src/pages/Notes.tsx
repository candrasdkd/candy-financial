import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Search, Copy, Trash2, Edit3, Pin, Check, X, Loader2, Calendar, User, HelpCircle, Info, Archive, Inbox, MessageCircle, Image as ImageIcon, Camera, Trash } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useConfirmStore } from '../store/useConfirmStore';
import { FamilyNote } from '../types/note';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Notes() {
  const { notes, loading, addNote, updateNote, deleteNote, archiveNote, uploadNoteImage, handleDelete } = useNotes();
  const { confirm, close } = useConfirmStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [editingNote, setEditingNote] = useState<FamilyNote | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    color: '#ffffff',
    imageUrl: '',
    imagePath: ''
  });
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const NOTE_COLORS = [
    { name: 'Default', value: '#ffffff' },
    { name: 'Rose', value: '#fff1f2' },
    { name: 'Blue', value: '#eff6ff' },
    { name: 'Green', value: '#f0fdf4' },
    { name: 'Amber', value: '#fffbeb' },
    { name: 'Purple', value: '#faf5ff' },
  ];

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'active' ? !note.isArchived : note.isArchived;
      return matchesSearch && matchesTab;
    });
  }, [notes, searchQuery, activeTab]);

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter(n => !n.isPinned), [filteredNotes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.content.trim()) return;

    if (editingNote) {
      confirm({
        title: 'Simpan Perubahan?',
        message: 'Apakah Anda yakin ingin menyimpan perubahan pada catatan ini?',
        confirmText: 'Simpan',
        onConfirm: async () => {
          try {
            setIsUploading(true);
            let imageData = { url: formData.imageUrl, path: formData.imagePath };
            if (tempFile) {
              imageData = await uploadNoteImage(tempFile);
            }
            await updateNote(editingNote.id, {
              ...formData,
              imageUrl: imageData.url,
              imagePath: imageData.path
            });
            closeForm();
          } catch (err) {
            console.error(err);
          } finally {
            setIsUploading(false);
            close();
          }
        }
      });
    } else {
      try {
        setIsUploading(true);
        let imageData = { url: '', path: '' };
        if (tempFile) {
          imageData = await uploadNoteImage(tempFile);
        }
        await addNote(formData.title, formData.content, formData.color, imageData);
        closeForm();
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  }

  function handleWhatsAppExport(note: FamilyNote) {
    let text = `*${note.title || 'Catatan Keluarga'}*\n\n`;
    
    // Process content for WhatsApp (simplified)
    const lines = note.content.split('\n');
    lines.forEach(line => {
      if (line.trim().startsWith('>x')) {
        text += `✅ ~${line.replace('>x', '').trim()}~\n`;
      } else if (line.trim().startsWith('>')) {
        text += `▫️ ${line.replace('>', '').trim()}\n`;
      } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        text += `• ${line.substring(1).trim()}\n`;
      } else {
        text += `${line}\n`;
      }
    });

    text += `\n_Dikirim dari CandyNest_`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }

  function handleCopy(note: FamilyNote) {
    const text = `${note.title ? note.title + '\n' : ''}${note.content}`;
    navigator.clipboard.writeText(text);
    setCopyingId(note.id);
    setTimeout(() => setCopyingId(null), 2000);
  }

  function startEdit(note: FamilyNote) {
    setEditingNote(note);
    setFormData({ 
      title: note.title, 
      content: note.content, 
      color: note.color || '#ffffff',
      imageUrl: note.imageUrl || '',
      imagePath: note.imagePath || ''
    });
    setPreviewUrl(note.imageUrl || null);
    setIsAdding(true);
  }

  function closeForm() {
    setIsAdding(false);
    setEditingNote(null);
    setFormData({ 
      title: '', 
      content: '', 
      color: '#ffffff',
      imageUrl: '',
      imagePath: ''
    });
    setTempFile(null);
    setPreviewUrl(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setTempFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-sage-300" />
        <p className="text-sm text-sage-400 font-medium">Membuka buku catatan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 md:pt-16 pb-32">
      <section className="relative mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-display text-sage-900 tracking-tight leading-none">
              Catatan <span className="text-rose-400">Penting</span>
            </h1>
            <p className="text-sage-400 font-medium text-sm md:text-base">Tulis hal-hal penting agar tidak lupa.</p>
          </div>
          
          <div className="flex items-center justify-center md:justify-end gap-3">
            <button
              onClick={() => setShowHelp(true)}
              className="w-12 h-12 rounded-2xl bg-white border border-sage-100 shadow-sm flex items-center justify-center text-sage-400 hover:text-sage-900 transition-all hover:shadow-md"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="hidden md:flex items-center justify-center gap-3 px-8 py-4 bg-sage-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-sage-900/20 hover:bg-black transition-all active:scale-95 group"
            >
              <Plus className="w-5 h-5" />
              Catatan Baru
            </button>
          </div>
        </div>
      </section>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-24 right-6 z-[100] md:hidden">
        <button
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-sage-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Formatting Guide Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sage-950/80 backdrop-blur-sm"
              onClick={() => setShowHelp(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-900 flex items-center justify-center text-white">
                      <Info className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-display text-sage-900">Panduan Format Pintar</h2>
                  </div>
                  <button onClick={() => setShowHelp(false)} className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center text-sage-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                        <Copy className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-sage-900">Tombol Salin & Keamanan</h3>
                    </div>
                    <div className="bg-sage-50 p-4 rounded-2xl space-y-3 border border-sage-100">
                      <div>
                        <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest mb-1">Cara Tulis:</p>
                        <p className="text-xs font-mono bg-white p-2 rounded-lg border border-sage-100">Email: candy@gmail.com</p>
                      </div>
                      <p className="text-xs text-sage-500 leading-relaxed">Gunakan tanda <span className="font-bold">titik dua (:)</span>. Muncul tombol copy khusus di baris tersebut. Jika ada kata <span className="font-bold italic">Sandi/Password</span>, otomatis akan disensor.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-sage-900">Daftar Ceklis Interaktif</h3>
                    </div>
                    <div className="bg-sage-50 p-4 rounded-2xl space-y-3 border border-sage-100">
                      <div>
                        <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest mb-1">Cara Tulis:</p>
                        <p className="text-xs font-mono bg-white p-2 rounded-lg border border-sage-100">&gt; Beli Gula</p>
                      </div>
                      <p className="text-xs text-sage-500 leading-relaxed">Gunakan tanda <span className="font-bold">lebih besar (&gt;)</span>. Kamu bisa langsung klik teksnya di layar untuk mencentang barang yang sudah selesai.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                        <StickyNote className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-sage-900">Daftar Poin & Catatan Biasa</h3>
                    </div>
                    <div className="bg-sage-50 p-4 rounded-2xl space-y-3 border border-sage-100">
                      <div>
                        <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest mb-1">Cara Tulis:</p>
                        <p className="text-xs font-mono bg-white p-2 rounded-lg border border-sage-100">- Barang Bawaan</p>
                      </div>
                      <p className="text-xs text-sage-500 leading-relaxed">Gunakan tanda <span className="font-bold">minus (-)</span> untuk list poin. Kamu juga bisa menulis bebas seperti biasa tanpa format apapun.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full py-4 bg-sage-100 text-sage-700 rounded-2xl font-bold hover:bg-sage-200 transition-all"
                >
                  Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Tab Switcher & Search Bar */}
      <section className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white p-1 rounded-2xl border border-sage-100 shadow-sm flex items-center">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'active' ? 'bg-sage-900 text-white shadow-md' : 'text-sage-400'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Aktif
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'archived' ? 'bg-sage-900 text-white shadow-md' : 'text-sage-400'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Arsip
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-1 border border-sage-100 shadow-sm flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-300" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-sage-300"
            />
          </div>
        </div>
      </section>

      {/* Notes Content */}
      {notes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-dashed border-sage-100 rounded-[3rem] py-20 px-10 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-sage-50 rounded-[2rem] flex items-center justify-center mx-auto border border-white">
            <StickyNote className="w-8 h-8 text-sage-200" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display text-sage-900">
              {activeTab === 'active' ? 'Belum ada catatan' : 'Arsip kosong'}
            </h3>
            <p className="text-sage-400 max-w-xs mx-auto text-sm leading-relaxed">
              {activeTab === 'active' 
                ? 'Gunakan fitur ini untuk menyimpan informasi penting keluarga.' 
                : 'Catatan yang kamu arsipkan akan muncul di sini.'}
            </p>
          </div>
          {activeTab === 'active' && (
            <button 
              onClick={() => setIsAdding(true)} 
              className="px-8 py-3 bg-sage-50 text-sage-600 rounded-2xl font-bold hover:bg-sage-100 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Catatan
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-12">
          {pinnedNotes.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-[10px] font-bold text-sage-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                <Pin className="w-3 h-3 rotate-45" /> Disematkan
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {pinnedNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onEdit={startEdit} 
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onPin={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    onArchive={() => archiveNote(note.id, !note.isArchived)}
                    onWhatsApp={handleWhatsAppExport}
                    onUpdate={updateNote}
                    isCopying={copyingId === note.id}
                  />
                ))}
              </div>
            </div>
          )}

          {otherNotes.length > 0 && (
            <div className="space-y-6">
              {pinnedNotes.length > 0 && (
                <h2 className="text-[10px] font-bold text-sage-400 uppercase tracking-[0.2em] px-2">Lainnya</h2>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {otherNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onEdit={startEdit} 
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onPin={() => updateNote(note.id, { isPinned: !note.isPinned })}
                    onArchive={() => archiveNote(note.id, !note.isArchived)}
                    onWhatsApp={handleWhatsAppExport}
                    onUpdate={updateNote}
                    isCopying={copyingId === note.id}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredNotes.length === 0 && searchQuery && (
            <div className="text-center py-20">
              <p className="text-sage-300 font-medium italic">Tidak ada catatan yang sesuai dengan pencarian.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sage-950/80 backdrop-blur-sm"
              onClick={closeForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display text-sage-900">
                    {editingNote ? 'Edit Catatan' : 'Buat Catatan Baru'}
                  </h2>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="w-10 h-10 rounded-full bg-sage-50 flex items-center justify-center text-sage-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sage-400 uppercase tracking-widest ml-1">Judul (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Daftar Belanja"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-sage-50 border-none focus:ring-2 focus:ring-sage-900/5 transition-all text-sage-900 font-bold placeholder:font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sage-400 uppercase tracking-widest ml-1">Isi Catatan</label>
                    <textarea
                      required
                      placeholder="Tuliskan hal penting di sini..."
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="w-full px-6 py-4 rounded-2xl bg-sage-50 border-none focus:ring-2 focus:ring-sage-900/5 transition-all text-sage-900 leading-relaxed resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sage-400 uppercase tracking-widest ml-1">Lampiran Foto (Opsional)</label>
                    <div className="flex flex-wrap gap-4">
                      {previewUrl ? (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-sage-100 shadow-sm">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setTempFile(null);
                              setPreviewUrl(null);
                              setFormData({ ...formData, imageUrl: '', imagePath: '' });
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-sage-100 bg-sage-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-sage-100 hover:border-sage-200 transition-all text-sage-400 hover:text-sage-600">
                          <Camera className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">Tambah</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-sage-400 uppercase tracking-widest ml-1">Pilih Warna</label>
                    <div className="flex items-center gap-3">
                      {NOTE_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.value })}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            formData.color === c.value ? 'border-sage-900 scale-110 shadow-lg' : 'border-white'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-4 rounded-2xl font-bold text-sage-500 hover:bg-sage-50 transition-colors"
                    disabled={isUploading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-[2] py-4 bg-sage-900 text-white rounded-2xl font-bold shadow-xl shadow-sage-900/20 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingNote ? 'Simpan Perubahan' : 'Simpan Catatan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onCopy, onPin, onArchive, onWhatsApp, onUpdate, isCopying }: { 
  note: FamilyNote; 
  onEdit: (n: FamilyNote) => void;
  onDelete: (n: FamilyNote) => void;
  onCopy: (n: FamilyNote) => void;
  onPin: () => void;
  onArchive: () => void;
  onWhatsApp: (n: FamilyNote) => void;
  onUpdate: (id: string, updates: Partial<FamilyNote>) => Promise<void>;
  isCopying: boolean;
}) {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const toggleCheckbox = async (idx: number) => {
    const lines = note.content.split('\n');
    const line = lines[idx];
    
    let newLine = line;
    const trimmed = line.trim();
    if (trimmed.startsWith('>x')) {
      // Toggle to unchecked
      newLine = line.replace(/>x\s?/, '> ');
    } else if (trimmed.startsWith('>')) {
      // Toggle to checked
      newLine = line.replace(/>\s?/, '>x ');
    }
    
    if (newLine !== line) {
      lines[idx] = newLine;
      await onUpdate(note.id, { content: lines.join('\n') });
    }
  };

  const renderContent = () => {
    const lines = note.content.split('\n');
    return (
      <div className="space-y-2.5">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          // Check for Checkbox: > or >x (with or without space)
          const isCheckbox = trimmed.startsWith('>') && !trimmed.startsWith('>>');
          
          if (isCheckbox) {
            const isChecked = trimmed.startsWith('>x');
            // Remove the trigger to get the text
            const text = trimmed.replace(/^>x?\s?/, '').trim();
            return (
              <div 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCheckbox(idx);
                }}
                className="flex items-start gap-3 group/check cursor-pointer"
              >
                <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                  isChecked ? 'bg-sage-900 border-sage-900 text-white' : 'bg-white border-sage-200 group-hover/check:border-sage-400'
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-sm transition-all ${isChecked ? 'text-sage-400 line-through' : 'text-sage-700 font-medium'}`}>
                  {text}
                </span>
              </div>
            );
          }

          // Check for Bullet points: - or * or •
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
          if (isBullet) {
            const text = line.trim().substring(2).trim();
            return (
              <div key={idx} className="flex items-start gap-3 pl-1">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-sage-300" />
                <span className="text-sm text-sage-700 font-medium">{text}</span>
              </div>
            );
          }

          // Check for Label: Value
          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const label = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            const isPassword = /pass|pwd|sandi|pin/i.test(label);
            const isVisible = showPasswords[idx];

            return (
              <div key={idx} className="group/field flex flex-col gap-1 bg-white/50 p-3 rounded-xl border border-sage-100/50 hover:border-sage-200 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sage-400 uppercase tracking-widest">{label}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                    {isPassword && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPasswords(prev => ({ ...prev, [idx]: !prev[idx] }));
                        }}
                        className="p-1 text-sage-400 hover:text-sage-900"
                      >
                        {isVisible ? <X className="w-3 h-3" /> : <div className="text-[10px] font-bold underline">Lihat</div>}
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(value);
                      }}
                      className="p-1 text-sage-400 hover:text-sage-900"
                      title="Salin nilai"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-medium text-sage-900 break-words flex items-center gap-2">
                  {isPassword && !isVisible ? (
                    <span className="tracking-widest font-black text-sage-300">••••••••</span>
                  ) : (
                    value
                  )}
                </div>
              </div>
            );
          }
          
          return (
            <p key={idx} className={`text-sage-600 text-sm leading-relaxed break-words ${line.trim() === '' ? 'h-2' : ''}`}>
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      layout
      style={{ backgroundColor: note.color || '#ffffff' }}
      className={`group rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border transition-all duration-300 relative flex flex-col gap-3 md:gap-4 ${
        note.color && note.color !== '#ffffff' ? 'border-black/5 shadow-md' : 'border-sage-100 shadow-sm'
      } hover:shadow-xl hover:border-sage-200 overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-2 md:gap-4 relative z-10">
        <div className="space-y-3 md:space-y-4 flex-1">
          {note.title && (
            <h3 className="font-bold text-sage-900 text-sm md:text-lg leading-tight line-clamp-2">{note.title}</h3>
          )}

          {note.imageUrl && (
            <div className="rounded-xl md:rounded-2xl overflow-hidden border border-sage-100/50 shadow-sm">
              <img src={note.imageUrl} alt="Lampiran" className="w-full h-auto max-h-32 md:max-h-48 object-cover" />
            </div>
          )}

          {renderContent()}
        </div>
        <button
          onClick={onPin}
          className={`p-2 rounded-xl transition-colors ${note.isPinned ? 'text-rose-500 bg-rose-50' : 'text-sage-300 hover:bg-sage-50 opacity-0 group-hover:opacity-100'}`}
        >
          <Pin className={`w-4 h-4 ${note.isPinned ? '' : 'rotate-45'}`} />
        </button>
      </div>

      <div className="flex flex-col gap-3 pt-3 mt-auto border-t border-sage-50 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-sage-900 uppercase tracking-tighter truncate max-w-[60px] md:max-w-none">
              {note.authorName}
            </span>
            <span className="text-[7px] font-bold text-sage-400 uppercase tracking-widest">
              {format(note.createdAt as Date, 'd MMM yy', { locale: id })}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onWhatsApp(note)}
              className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center text-green-500 hover:bg-green-50"
            >
              <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => onCopy(note)}
              className={`w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center ${isCopying ? 'bg-green-50 text-green-600' : 'text-sage-400 hover:bg-sage-50'}`}
            >
              {isCopying ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </button>
            <button
              onClick={onArchive}
              className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center text-sage-400 hover:bg-sage-50"
            >
              {note.isArchived ? <Inbox className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Archive className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            </button>
            <button
              onClick={() => onEdit(note)}
              className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center text-sage-400 hover:bg-sage-50"
            >
              <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              onClick={() => onDelete(note)}
              className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center text-sage-400 hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
