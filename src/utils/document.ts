import { DocCategory, OcrField } from '../types/document';
import { FIELD_TEMPLATES } from '../constants/document';

/** Format ukuran byte ke string yang mudah dibaca */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/** Mencari nilai setelah keyword tertentu dalam baris teks */
export function extractAfterKeyword(lines: string[], ...keywords: string[]): string {
  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        const ci = line.indexOf(':');
        if (ci >= 0) return line.slice(ci + 1).trim();
        const ki = lower.indexOf(kw.toLowerCase());
        return line.slice(ki + kw.length).trim().replace(/^[:.]\s*/, '');
      }
    }
  }
  return '';
}

/** Kompresi gambar menggunakan Canvas */
export async function compressImage(file: File, maxSizeKB: number = 500): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_SIDE = 1600;
        if (width > MAX_SIDE || height > MAX_SIDE) {
          if (width > height) {
            height = (height / width) * MAX_SIDE;
            width = MAX_SIDE;
          } else {
            width = (width / height) * MAX_SIDE;
            height = MAX_SIDE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        let quality = 0.8;
        const attemptCompress = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Gagal memproses gambar'));
            if (blob.size / 1024 > maxSizeKB && q > 0.2) {
              attemptCompress(q - 0.1);
            } else {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', q);
        };
        attemptCompress(quality);
      };
    };
    reader.onerror = reject;
  });
}

/** Pre-processing gambar untuk meningkatkan akurasi OCR */
export async function preprocessForOcr(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject();
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
    };
    reader.onerror = reject;
  });
}

/** Parsing teks mentah hasil OCR menjadi field-field terstruktur */
export function parseOcrToFields(text: string, category: DocCategory): OcrField[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const templates = FIELD_TEMPLATES[category];

  if (category === 'lainnya') {
    return lines.slice(0, 20).map((v, i) => ({ label: `Baris ${i + 1}`, value: v }));
  }

  const result: OcrField[] = [];
  
  if (category === 'ktp') {
    result.push({ label: 'NIK', value: extractAfterKeyword(lines, 'NIK', 'NIIK', 'NIK / NIK') });
    result.push({ label: 'Nama', value: extractAfterKeyword(lines, 'Nama', 'NAMA') });
    result.push({ label: 'Tempat/Tgl Lahir', value: extractAfterKeyword(lines, 'Tempat/Tgl Lahir', 'Tempat/Tgl') });
    result.push({ label: 'Alamat', value: extractAfterKeyword(lines, 'Alamat', 'ALAMAT') });
  } else if (category === 'sim') {
    result.push({ label: 'Nomor SIM', value: lines.find(l => /^\d{4}-\d{4}-\d{6}/.test(l)) || '' });
    result.push({ label: 'Nama', value: extractAfterKeyword(lines, 'Nama', 'NAMA') });
    result.push({ label: 'Alamat', value: extractAfterKeyword(lines, 'Alamat', 'ALAMAT') });
  } else if (category === 'npwp') {
    result.push({ label: 'NPWP', value: lines.find(l => /\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}/.test(l)) || '' });
    result.push({ label: 'Nama', value: extractAfterKeyword(lines, 'Nama', 'NAMA') });
  } else if (category === 'nikah') {
    result.push({ label: 'No. Buku Nikah', value: extractAfterKeyword(lines, 'No.', 'Nomor', 'Kutipan') });
    result.push({ label: 'Nama Suami', value: extractAfterKeyword(lines, 'Suami', 'Pria') });
    result.push({ label: 'Nama Istri', value: extractAfterKeyword(lines, 'Istri', 'Wanita') });
  }

  // Fallback: Pastikan semua field template ada di hasil meskipun kosong
  templates.forEach(label => {
    if (!result.find(r => r.label === label)) {
      result.push({ label, value: '' });
    }
  });

  return result;
}
