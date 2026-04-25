import { useState, useEffect, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { FamilyDocument, DocCategory, OcrField } from '../types/document';
import { compressImage, preprocessForOcr, parseOcrToFields } from '../utils/document';

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

  return {
    documents,
    loading,
    uploading,
    uploadProgress,
    ocrLoading,
    error,
    scanDocument,
    rescanDocument,
    uploadAndSave,
    deleteDocument,
    updateDocument,
    compress: compressImage
  };
}
