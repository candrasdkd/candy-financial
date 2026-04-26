import { DocCategory, OcrField } from '../types/document';
import { FIELD_TEMPLATES } from '../constants/document';

/** Format ukuran byte ke string yang mudah dibaca */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
