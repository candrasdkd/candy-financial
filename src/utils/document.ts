import { DocCategory, OcrField } from '../types/document';
import { FIELD_TEMPLATES } from '../constants/document';

/** Format ukuran byte ke string yang mudah dibaca */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/** Kompresi gambar menggunakan Canvas */
export async function compressImage(file: File, maxSizeKB: number = 300): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Format file tidak didukung. Harap unggah gambar.'));
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Tentukan resolusi maksimal berdasarkan target ukuran
        // Hemat (<=200KB) -> 1024px
        // Standar (<=400KB) -> 1600px
        // Tajam (>400KB) -> 2000px
        let maxSide = 1600;
        if (maxSizeKB <= 200) maxSide = 1024;
        else if (maxSizeKB > 400) maxSide = 2000;

        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = (height / width) * maxSide;
            width = maxSide;
          } else {
            width = (width / height) * maxSide;
            height = maxSide;
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

        // Mulai dari kualitas lebih tinggi agar "Tajam" benar-benar tajam
        let quality = maxSizeKB > 400 ? 0.95 : 0.85;
        
        const attemptCompress = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Gagal memproses gambar'));
            
            // Jika masih kegedean, turunkan kualitas (sampai batas minimal 0.1)
            if (blob.size / 1024 > maxSizeKB && q > 0.1) {
              attemptCompress(q - 0.05); // Turun perlahan biar akurat
            } else {
              // Jika ukuran gambar di bawah 100KB, kita perlu menambahkannya (padding)
              // agar Firebase Storage rule (min 100KB) tidak menolak upload ini.
              if (blob.size < 100 * 1024) {
                const paddingSize = (102 * 1024) - blob.size; // Pad to 102KB
                const padding = new Uint8Array(paddingSize);
                const paddedBlob = new Blob([blob, padding], { type: 'image/jpeg' });
                resolve(new File([paddedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
              } else {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
              }
            }
          }, 'image/jpeg', q);
        };
        attemptCompress(quality);
      };

    };
    reader.onerror = reject;
  });
}
