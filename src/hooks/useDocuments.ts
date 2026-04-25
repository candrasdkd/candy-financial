import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { FamilyDocument, DocCategory, OcrField } from '../types/document';
import { compressImage, preprocessForOcr, parseOcrToFields } from '../utils/document';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { CATEGORY_INFO } from '../constants/document';
import { useConfirmStore } from '../store/useConfirmStore';

export * from '../types/document';
export * from '../constants/document';

export function useDocuments() {
  const { userProfile } = useAuthStore();
  const [documents, setDocuments] = useState<FamilyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI States
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<FamilyDocument | null>(null);
  const [activeCat, setActiveCat] = useState<DocCategory | 'all'>('all');
  const [activePartner, setActivePartner] = useState<string | 'all'>('all');
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // Selection States
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const { confirm } = useConfirmStore();

  useEffect(() => {
    if (!userProfile?.coupleId) return;
    const q = query(
      collection(db, 'family_documents'),
      where('coupleId', '==', userProfile.coupleId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .map(d => ({
          ...d,
          createdAt: d.createdAt?.toDate() || new Date()
        })) as FamilyDocument[];
      setDocuments(docs);
      setLoading(false);
    });
  }, [userProfile?.coupleId]);

  /** Step 1: Scan Lokal Tanpa Upload */
  const scanDocument = useCallback(async (files: File[], category: DocCategory) => {
    setError(null);
    setOcrLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('ind+eng', 1, { logger: () => {} });
      
      let combinedText = '';
      for (const file of files) {
        const processedImageUrl = await preprocessForOcr(file);
        const { data } = await worker.recognize(processedImageUrl);
        combinedText += data.text.trim() + '\n';
      }
      
      await worker.terminate();
      const fields = parseOcrToFields(combinedText, category);
      setOcrLoading(false);
      return { rawText: combinedText, fields };
    } catch (err: any) {
      setOcrLoading(false);
      setError('Gagal membaca dokumen. Pastikan foto cukup jelas.');
      throw err;
    }
  }, []);

  /** Re-scan dari URL gambar yang sudah tersimpan di cloud */
  const rescanDocument = useCallback(async (documentId: string, imageUrls: string[], category: DocCategory) => {
    setError(null);
    setOcrLoading(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('ind+eng', 1, { logger: () => {} });

      let combinedText = '';
      for (const url of imageUrls) {
        // Fetch gambar dari URL → konversi ke File agar bisa di-preprocess
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], 'page.jpg', { type: blob.type || 'image/jpeg' });
        const processedImageUrl = await preprocessForOcr(file);
        const { data } = await worker.recognize(processedImageUrl);
        combinedText += data.text.trim() + '\n';
      }

      await worker.terminate();
      const fields = parseOcrToFields(combinedText, category);

      // Simpan langsung ke Firestore
      const docRef = doc(db, 'family_documents', documentId);
      await updateDoc(docRef, { fields, extractedText: combinedText });

      setOcrLoading(false);
      return { rawText: combinedText, fields };
    } catch (err: any) {
      setOcrLoading(false);
      setError('Gagal scan ulang dokumen.');
      throw err;
    }
  }, []);

  /** Step 2: Upload & Simpan Firestore */
  const uploadAndSave = useCallback(async (params: {
    files: File[];
    name: string;
    category: DocCategory;
    fields: OcrField[];
    rawText: string;
  }) => {
    if (!userProfile?.coupleId || !userProfile?.displayName) throw new Error('Akun belum terhubung.');
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const imageUrls: string[] = [];
      const storagePaths: string[] = [];
      
      let totalBytes = 0;
      params.files.forEach(f => totalBytes += f.size);
      let uploadedBytes = 0;

      for (const file of params.files) {
        const ext = file.name.split('.').pop();
        const storagePath = `family_documents/${userProfile.coupleId}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
        const storageRef = ref(storage, storagePath);

        await new Promise<void>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file);
          task.on('state_changed',
            snap => {
              const currentProgress = ((uploadedBytes + snap.bytesTransferred) / totalBytes) * 100;
              setUploadProgress(Math.round(currentProgress));
            },
            reject,
            () => {
              uploadedBytes += file.size;
              resolve();
            }
          );
        });

        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
        storagePaths.push(storagePath);
      }

      await addDoc(collection(db, 'family_documents'), {
        name: params.name,
        category: params.category,
        imageUrls,
        storagePaths,
        fields: params.fields,
        extractedText: params.rawText,
        uploadedBy: userProfile.displayName,
        coupleId: userProfile.coupleId,
        createdAt: serverTimestamp(),
      });
      setUploading(false);
    } catch (err: any) {
      setUploading(false);
      setError(err.message ?? 'Gagal menyimpan dokumen.');
      throw err;
    }
  }, [userProfile]);

  const deleteDocument = useCallback(async (document: FamilyDocument) => {
    try {
      const paths = document.storagePaths || (document.storagePath ? [document.storagePath] : []);
      const deletePromises = paths.map(path => deleteObject(ref(storage, path)));
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, 'family_documents', document.id));
    } catch (err: any) {
      setError(err.message ?? 'Gagal menghapus dokumen.');
      throw err;
    }
  }, []);

  const updateDocument = useCallback(async (id: string, updates: Partial<FamilyDocument>) => {
    try {
      const docRef = doc(db, 'family_documents', id);
      await updateDoc(docRef, updates);
    } catch (err: any) {
      setError(err.message ?? 'Gagal memperbarui dokumen.');
      throw err;
    }
  }, []);

  // Derived States
  const partners = Array.from(new Set(documents.map(d => d.uploadedBy).filter(Boolean)));
  const filtered = documents.filter(d => {
    const catOk = activeCat === 'all' || d.category === activeCat;
    const partnerOk = activePartner === 'all' || d.uploadedBy === activePartner;
    return catOk && partnerOk;
  });
  const activeLabel = activeCat === 'all' ? 'Semua Dokumen' : CATEGORY_INFO[activeCat].label;

  // Actions
  const toggleDocSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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

  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
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

      if (!pageAdded) throw new Error('Tidak ada gambar yang berhasil dimuat.');

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

  const handleDelete = (docItem: FamilyDocument) => {
    confirm({
      title: 'Hapus Dokumen?',
      message: `Apakah kamu yakin ingin menghapus "${docItem.name}"? File di cloud akan dihapus permanen.`,
      confirmText: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteDocument(docItem);
          setSelected(null);
        } catch (err: any) {
          alert('Gagal menghapus: ' + err.message);
        }
      }
    });
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return {
    documents,
    loading,
    uploading,
    uploadProgress,
    ocrLoading,
    error,
    showUpload, setShowUpload,
    selected, setSelected,
    activeCat, setActiveCat,
    activePartner, setActivePartner,
    showCatDropdown, setShowCatDropdown,
    isSelectMode, setIsSelectMode,
    selectedIds, setSelectedIds,
    isExporting,
    partners,
    filtered,
    activeLabel,
    scanDocument,
    rescanDocument,
    uploadAndSave,
    deleteDocument,
    updateDocument,
    toggleDocSelection,
    handleExportPDF,
    handleDelete,
    getInitials,
    compress: compressImage
  };
}
