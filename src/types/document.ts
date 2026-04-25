export type DocCategory = 'ktp' | 'sim' | 'npwp' | 'nikah' | 'ijazah' | 'akta' | 'paspor' | 'kk' | 'sertifikat' | 'bpjs_kes' | 'bpjs_ket' | 'asuransi' | 'lainnya';

export interface OcrField {
  label: string;
  value: string;
}

export interface FamilyDocument {
  id: string;
  name: string;
  category: DocCategory;
  imageUrls: string[];
  storagePaths: string[];
  imageUrl?: string;    // Legacy
  storagePath?: string; // Legacy
  extractedText: string;
  fields: OcrField[];
  uploadedBy: string;
  createdAt: Date;
  coupleId: string;
}
