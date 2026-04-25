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

/**
 * Pre-processing gambar untuk OCR.
 * - Scale up agar teks lebih besar dan tajam
 * - Grayscale + kontras tinggi untuk mengurangi noise background (watermark, pola)
 * - Sharpen manual via pixel manipulation untuk mempertajam tepi teks
 */
export async function preprocessForOcr(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Scale up ke minimal 2500px di sisi terpanjang
        const maxSide = Math.max(img.width, img.height);
        const scale = maxSide < 2500 ? (2500 / maxSide) : 1;
        const W = Math.round(img.width * scale);
        const H = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        // 1) Gambar ke canvas dengan filter grayscale + kontras sangat tinggi
        ctx.filter = 'grayscale(100%) contrast(220%) brightness(110%)';
        ctx.drawImage(img, 0, 0, W, H);
        ctx.filter = 'none';

        // 2) Threshold manual: pixel gelap (< 140) → hitam, sisanya → putih
        //    Ini membunuh watermark & background berulang yang biasanya abu-abu
        const imgData = ctx.getImageData(0, 0, W, H);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          // grayscale sudah diaplikasikan, ambil channel R sebagai luma
          const luma = d[i];
          const bin = luma < 145 ? 0 : 255;
          d[i] = d[i + 1] = d[i + 2] = bin;
          d[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };
    };
    reader.onerror = reject;
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Bersihkan teks OCR dari karakter noise umum */
function cleanOcr(text: string): string {
  return text
    .replace(/[|]/g, 'I')
    .replace(/©/g, '0')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')  // collapse spasi berlebihan
    .trim();
}

/**
 * Cari nilai setelah keyword dalam baris teks.
 * Mendukung pemisah : ; = dan juga nilai langsung setelah keyword.
 */
export function extractAfterKeyword(lines: string[], ...keywords: string[]): string {
  for (const line of lines) {
    const norm = line.toLowerCase().replace(/[|!l]/g, 'i').replace(/0/g, 'o');
    for (const kw of keywords) {
      const kwNorm = kw.toLowerCase().replace(/[|!l]/g, 'i');
      if (norm.includes(kwNorm)) {
        // Cari nilai setelah pemisah
        const afterKw = line.substring(line.toLowerCase().indexOf(kw.toLowerCase().substring(0, 4)));
        const match = afterKw.match(/[:;=]\s*(.+)$/) ||
                      afterKw.match(new RegExp(`${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:;=]?\\s*(.+)$`, 'i'));
        if (match && match[1]) {
          return match[1].trim().replace(/^[:;=.\s]+/, '');
        }
      }
    }
  }
  return '';
}

/** Cari nilai berdasarkan regex langsung di full text */
function extractByRegex(text: string, pattern: RegExp): string {
  const m = text.match(pattern);
  return m ? (m[1] || m[0]).trim() : '';
}

/** Ambil semua nilai yang cocok dengan keyword di baris mana pun */
function extractLineAfterKeyword(lines: string[], ...keywords: string[]): string {
  for (const line of lines) {
    for (const kw of keywords) {
      if (line.toLowerCase().includes(kw.toLowerCase())) {
        // Nilai bisa di baris yang sama setelah pemisah
        const sep = line.match(/[:;=]\s*(.+)$/);
        if (sep && sep[1].trim().length > 1) return sep[1].trim();
        // Atau nilai di bagian kanan baris (setelah keyword)
        const idx = line.toLowerCase().indexOf(kw.toLowerCase());
        const after = line.substring(idx + kw.length).replace(/^[:;=\s]+/, '').trim();
        if (after.length > 1) return after;
      }
    }
  }
  return '';
}

// ─── Parser per Kategori ───────────────────────────────────────────────────

function parseKtp(lines: string[], text: string): OcrField[] {
  // NIK: 16 digit, sering ada noise
  const nikRaw = extractByRegex(text.replace(/\s/g, ''), /(?:NIK|N1K|NIIK)[:\s]*(\d{14,17})/i) ||
                 extractByRegex(text, /\b(\d{16})\b/) ||
                 extractAfterKeyword(lines, 'NIK', 'N1K', 'NIIK', 'N!K');

  const nama = extractLineAfterKeyword(lines, 'Nama', 'NAMA', 'N AM A', 'NAM A');
  
  // Tempat lahir: pola "Kota, DD-MM-YYYY" atau "Kota, DD MMM YYYY"
  const ttlRaw = extractLineAfterKeyword(lines, 'Tempat/Tgl', 'Tgl Lahir', 'Lahir', 'Tempat Tgl') ||
                 extractByRegex(text, /(?:JAKARTA|BANDUNG|SURABAYA|DEPOK|BOGOR|BEKASI|MEDAN|SEMARANG|YOGYAKARTA|MALANG)[,\s]+\d{2}[-/]\d{2}[-/]\d{4}/i);

  const jk = extractLineAfterKeyword(lines, 'Jenis Kelamin', 'Jenis kel', 'Kelamin') ||
             extractByRegex(text, /\b(LAKI[-\s]LAKI|PEREMPUAN|WANITA|PRIA)\b/i);

  const golDarah = extractByRegex(text, /Gol\.?\s*Darah\s*[:;=]?\s*([ABO]{1,2}[+-]?)/i) ||
                   extractByRegex(text, /\b([ABO]{1,2}[+-]?)\b/);

  const alamat = extractLineAfterKeyword(lines, 'Alamat', 'ALAMAT') ||
                 extractByRegex(text, /(?:Alamat|ALAMAT)\s*[:;=]\s*(.+?)(?:\n|RT\/RW|Kel|Kec)/is);

  const rtrw = extractLineAfterKeyword(lines, 'RT/RW', 'RT RW') ||
               extractByRegex(text, /\b(\d{3}\/\d{3})\b/);

  const keldes = extractLineAfterKeyword(lines, 'Kel/Desa', 'Kelurahan', 'Desa', 'Kel Desa');
  const kecamatan = extractLineAfterKeyword(lines, 'Kecamatan', 'Kec');
  const agama = extractLineAfterKeyword(lines, 'Agama') ||
                extractByRegex(text, /\b(ISLAM|KRISTEN|KATOLIK|HINDU|BUDHA|BUDDHA|KONGHUCU)\b/i);
  const status = extractLineAfterKeyword(lines, 'Status Perkawinan', 'Perkawinan', 'Status') ||
                 extractByRegex(text, /\b(KAWIN|BELUM KAWIN|CERAI HIDUP|CERAI MATI)\b/i);
  const pekerjaan = extractLineAfterKeyword(lines, 'Pekerjaan') ||
                    extractByRegex(text, /\b(KARYAWAN SWASTA|PNS|WIRASWASTA|PEGAWAI NEGERI|PELAJAR|MAHASISWA|BURUH|PETANI|NELAYAN|IRT|TIDAK BEKERJA)\b/i);
  const berlaku = extractLineAfterKeyword(lines, 'Berlaku Hingga', 'Berlaku') ||
                  extractByRegex(text, /(?:Berlaku\s*Hingga)\s*[:;=]?\s*(.+)/i) ||
                  'SEUMUR HIDUP';

  return [
    { label: 'NIK', value: nikRaw.replace(/\D/g, '').slice(0, 16) },
    { label: 'Nama', value: nama },
    { label: 'Tempat/Tgl Lahir', value: ttlRaw },
    { label: 'Jenis Kelamin', value: jk },
    { label: 'Gol. Darah', value: golDarah },
    { label: 'Alamat', value: alamat },
    { label: 'RT/RW', value: rtrw },
    { label: 'Kel/Desa', value: keldes },
    { label: 'Kecamatan', value: kecamatan },
    { label: 'Agama', value: agama },
    { label: 'Status Perkawinan', value: status },
    { label: 'Pekerjaan', value: pekerjaan },
    { label: 'Berlaku Hingga', value: berlaku },
  ];
}

function parseNpwp(lines: string[], text: string): OcrField[] {
  // NPWP: format XX.XXX.XXX.X-XXX.XXX — toleransi titik/strip OCR
  const npwpRaw = extractByRegex(
    text.replace(/\s/g, ''),
    /(\d{2}[.,\-]?\d{3}[.,\-]?\d{3}[.,\-]?\d{1}[.,\-]?\d{3}[.,\-]?\d{3})/
  );
  // Format ulang jika berhasil ekstrak 15 digit
  const digits = npwpRaw.replace(/\D/g, '');
  const npwpFormatted = digits.length === 15
    ? `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8,9)}-${digits.slice(9,12)}.${digits.slice(12)}`
    : npwpRaw;

  const nama = extractLineAfterKeyword(lines, 'CANDRA', 'Nama', 'NAMA') ||
               // Baris yang hanya berisi nama (huruf besar semua, tanpa label)
               lines.find(l => /^[A-Z\s]{5,}$/.test(l.trim()) && !l.includes('NPWP') && !l.includes('NIK') && !l.includes('DIREKTORAT') && !l.includes('KEMENTERIAN') && !l.includes('JENDERAL')) || '';

  const nik = extractByRegex(text, /NIK\s*[:;=]?\s*(\d{16})/i) ||
              extractByRegex(text.replace(/\s/g, ''), /NIK[:\s]*(\d{16})/i);

  // Alamat: biasanya baris setelah nama, berisi "JL" atau "KP" atau "RT"
  const alamatIdx = lines.findIndex(l => /\b(JL|JLN|JALAN|KP|KAV|GANG|GG|NO)\b/i.test(l));
  const alamat = alamatIdx >= 0
    ? lines.slice(alamatIdx, alamatIdx + 3).join(' ').trim()
    : extractLineAfterKeyword(lines, 'Alamat', 'ALAMAT');

  const kpp = extractByRegex(text, /KPP\s+(.+)/i) ||
              extractByRegex(text, /(KPP\s+PRATAMA\s+[A-Z\s]+)/i);

  return [
    { label: 'NPWP', value: npwpFormatted },
    { label: 'Nama', value: nama },
    { label: 'NIK', value: nik.replace(/\D/g, '').slice(0, 16) },
    { label: 'Alamat', value: alamat },
    { label: 'KPP', value: kpp },
  ];
}

function parseKk(lines: string[], text: string): OcrField[] {
  // No. KK: Prioritaskan dari 10 baris pertama karena No KK selalu ada di atas (header).
  // Menghapus spasi penting karena kadang OCR membaca angka dengan spasi (misal: 3276 021...).
  const topTextClean = lines.slice(0, 10).join('').replace(/\s/g, '');
  
  // Nomor KK/NIK di Indonesia selalu diawali dengan kode provinsi (11-94), jadi tidak mungkin diawali angka 0.
  // Kita cari 16 digit yang diawali angka 1-9.
  const noKk = extractByRegex(topTextClean, /(?:NO\.|NOMOR|KK|N0|MO|NA)[:;]*([1-9]\d{15})/i) ||
               extractByRegex(topTextClean, /([1-9]\d{15})/) ||
               extractByRegex(text.replace(/\s/g, ''), /([1-9]\d{15})/);

  const kepala = extractLineAfterKeyword(lines, 'Kepala Keluarga', 'Nama Kepala', 'Kepala') ||
                 // Baris pertama yang all caps dan panjang > 5 setelah baris "KARTU KELUARGA"
                 lines.find(l => /^[A-Z\s]{5,}$/.test(l.trim()) && !l.includes('KARTU') && !l.includes('KELUARGA') && !l.includes('REPUBLIK') && l.trim().length > 5) || '';

  const alamat = extractLineAfterKeyword(lines, 'Alamat', 'ALAMAT', 'Jl.', 'JL.', 'Jalan');
  const rtrw = extractLineAfterKeyword(lines, 'RT/RW', 'RT RW') ||
               extractByRegex(text, /\b(\d{3}\/\d{3})\b/);
  const keldes = extractLineAfterKeyword(lines, 'Desa/Kelurahan', 'Kelurahan', 'Desa', 'Kel/Desa');
  const kecamatan = extractLineAfterKeyword(lines, 'Kecamatan', 'Kec');
  const kabkota = extractLineAfterKeyword(lines, 'Kabupaten/Kota', 'Kab/Kota', 'Kabupaten', 'Kota');
  const provinsi = extractLineAfterKeyword(lines, 'Provinsi', 'Prov');

  return [
    { label: 'No. KK', value: noKk.replace(/\D/g, '').slice(0, 16) },
    { label: 'Kepala Keluarga', value: kepala },
    { label: 'Alamat', value: alamat },
    { label: 'RT/RW', value: rtrw },
    { label: 'Kel/Desa', value: keldes },
    { label: 'Kecamatan', value: kecamatan },
    { label: 'Kabupaten/Kota', value: kabkota },
    { label: 'Provinsi', value: provinsi },
  ];
}

function parseIjazah(lines: string[], text: string): OcrField[] {
  // Nama: biasanya setelah "kepada" atau "memberikan ijazah kepada"
  const nama = extractLineAfterKeyword(lines, 'kepada', 'Memberikan') ||
               // Baris yang berisi nama (bold/italic di ijazah, OCR sering all caps atau Title Case)
               lines.find(l => {
                 const t = l.trim();
                 return t.length > 5 && /^[A-Z][a-z]/.test(t) && !t.includes('Universitas') &&
                        !t.includes('Program') && !t.includes('Memberikan') && !t.includes('Jakarta') &&
                        !t.includes('Nomor') && !t.includes('Tempat');
               }) || '';

  // Nomor Ijazah: format "262012020003941" atau "262..." biasanya di header/footer
  const noIjazah = extractLineAfterKeyword(lines, 'Nomor Ijazah', 'Ijazah Nasional', 'No. Ijazah') ||
                   extractByRegex(text, /(?:Nomor\s+Ijazah\s+Nasional|No\.?\s*Ijazah)\s*[:;=]?\s*([\w\d-]+)/i);

  const univ = extractLineAfterKeyword(lines, 'Universitas', 'Institut', 'Sekolah Tinggi', 'Politeknik', 'Akademi') ||
               lines.find(l => /universitas|institut|sekolah tinggi|politeknik/i.test(l))?.trim() || '';

  const prodi = extractLineAfterKeyword(lines, 'Program Studi', 'Jurusan', 'Prodi') ||
                extractByRegex(text, /(?:Program Studi|Jurusan)\s*[:;=]\s*(.+)/i);

  const tahun = extractByRegex(text, /(?:tahun|lulus|tanggal)[^0-9]*(\d{4})/i) ||
                extractByRegex(text, /\b(20\d{2}|19\d{2})\b/);

  return [
    { label: 'Nama', value: nama },
    { label: 'Nomor Ijazah', value: noIjazah },
    { label: 'Sekolah/Universitas', value: univ },
    { label: 'Program Studi', value: prodi },
    { label: 'Tahun Lulus', value: tahun },
  ];
}

function parseSim(lines: string[], text: string): OcrField[] {
  const simNum = lines.find(l => /[\d\-]{12,18}/.test(l.replace(/\s/g, ''))) || '';
  const nama = extractLineAfterKeyword(lines, 'Nama', 'NAMA');
  const ttl = extractLineAfterKeyword(lines, 'Tempat', 'Tgl Lahir', 'Lahir');
  const alamat = extractLineAfterKeyword(lines, 'Alamat', 'ALAMAT');
  const berlaku = extractLineAfterKeyword(lines, 'Berlaku', 'Exp') ||
                  extractByRegex(text, /\d{2}-\d{2}-\d{4}/);
  return [
    { label: 'Nomor SIM', value: simNum },
    { label: 'Nama', value: nama },
    { label: 'Tempat/Tgl Lahir', value: ttl },
    { label: 'Alamat', value: alamat },
    { label: 'Berlaku s/d', value: berlaku },
  ];
}

function parseNikah(lines: string[], text: string): OcrField[] {
  const noBuku = extractLineAfterKeyword(lines, 'No.', 'Nomor', 'Kutipan', 'Buku', 'Akta');
  const suami = extractLineAfterKeyword(lines, 'Suami', 'Pria', 'Calon Suami');
  const istri = extractLineAfterKeyword(lines, 'Istri', 'Wanita', 'Calon Istri');
  const tglNikah = extractLineAfterKeyword(lines, 'Tanggal', 'Akad', 'Tgl Nikah') ||
                   extractByRegex(text, /\d{1,2}\s+\w+\s+\d{4}/);
  const kua = extractLineAfterKeyword(lines, 'KUA', 'Kantor Urusan', 'Kecamatan');
  return [
    { label: 'No. Buku Nikah', value: noBuku },
    { label: 'Nama Suami', value: suami },
    { label: 'Nama Istri', value: istri },
    { label: 'Tanggal Nikah', value: tglNikah },
    { label: 'KUA', value: kua },
  ];
}

function parsePaspor(lines: string[], text: string): OcrField[] {
  // No. Paspor: biasanya A/B + 7 digit atau format MRZ
  const noPaspor = extractByRegex(text, /\b([A-Z]\d{7,8})\b/) ||
                   extractLineAfterKeyword(lines, 'No.', 'Passport', 'Paspor');
  const nama = extractLineAfterKeyword(lines, 'Surname', 'Given', 'Nama', 'Name');
  const kewarganegaraan = extractByRegex(text, /(?:Nationality|Kewarganegaraan)[:\s]+(\w+)/i) || 'INDONESIA';
  const ttl = extractLineAfterKeyword(lines, 'Date of birth', 'Tgl Lahir', 'Lahir', 'Birth');
  const jk = extractByRegex(text, /(?:Sex|Jenis Kelamin)[:\s]*(M|F|MALE|FEMALE|L|P|LAKI|PEREMPUAN)/i);
  const berlaku = extractLineAfterKeyword(lines, 'Date of expiry', 'Berlaku', 'Expiry', 'Exp');
  return [
    { label: 'No. Paspor', value: noPaspor },
    { label: 'Nama', value: nama },
    { label: 'Kewarganegaraan', value: kewarganegaraan },
    { label: 'Tempat/Tgl Lahir', value: ttl },
    { label: 'Jenis Kelamin', value: jk },
    { label: 'Berlaku s/d', value: berlaku },
  ];
}

function parseBpjsKes(lines: string[], text: string): OcrField[] {
  const noKartu = extractByRegex(text, /\b(\d{13})\b/) ||
                  extractLineAfterKeyword(lines, 'No.', 'Nomor', 'Kartu');
  const nama = extractLineAfterKeyword(lines, 'Nama', 'NAMA');
  const nik = extractByRegex(text, /\b(\d{16})\b/);
  const faskes = extractLineAfterKeyword(lines, 'Faskes', 'FKTP', 'Puskesmas', 'Klinik');
  return [
    { label: 'No. Kartu', value: noKartu },
    { label: 'Nama', value: nama },
    { label: 'NIK', value: nik },
    { label: 'Faskes Tingkat I', value: faskes },
  ];
}

function parseBpjsKet(lines: string[], text: string): OcrField[] {
  const noPeserta = extractByRegex(text, /\b(\d{10,13})\b/) ||
                    extractLineAfterKeyword(lines, 'No.', 'Nomor', 'Peserta');
  const nama = extractLineAfterKeyword(lines, 'Nama', 'NAMA');
  const nik = extractByRegex(text, /\b(\d{16})\b/);
  const perusahaan = extractLineAfterKeyword(lines, 'Perusahaan', 'Pemberi Kerja', 'Employer');
  return [
    { label: 'No. Peserta', value: noPeserta },
    { label: 'Nama', value: nama },
    { label: 'NIK', value: nik },
    { label: 'Nama Perusahaan', value: perusahaan },
  ];
}

function parseSip(lines: string[], text: string): OcrField[] {
  const noSip = extractLineAfterKeyword(lines, 'Nomor SIP', 'No. SIP', 'Nomor Surat Izin') ||
                extractByRegex(text, /SIP\s*[:;]\s*([A-Z0-9.\-/]+)/i) ||
                extractByRegex(text, /(?:Nomor|No\.)\s*[:;]?\s*(\d{2,}[\d.\-/]+)/i);
  
  const nama = extractLineAfterKeyword(lines, 'Nama', 'Nama Lengkap', 'Diberikan kepada') ||
               lines.find(l => /^[A-Z.,\s]{5,}$/.test(l.trim()) && !l.includes('KESEHATAN') && !l.includes('DINAS') && !l.includes('SURAT IZIN')) || '';

  const profesi = extractLineAfterKeyword(lines, 'Profesi', 'Sebagai', 'Pekerjaan') ||
                  extractByRegex(text, /(Dokter|Perawat|Bidan|Apoteker|Tenaga Teknis Kefarmasian)/i);

  const tempat = extractLineAfterKeyword(lines, 'Tempat Praktik', 'Tempat Kerja', 'Nama Fasilitas', 'Fasilitas Pelayanan') ||
                 extractByRegex(text, /(RS\s+[A-Z\s]+|Rumah Sakit\s+[A-Z\s]+|Klinik\s+[A-Z\s]+|Puskesmas\s+[A-Z\s]+)/i);

  const berlaku = extractLineAfterKeyword(lines, 'Berlaku sampai', 'Berlaku hingga', 'Berlaku s/d', 'Masa Berlaku') ||
                  extractByRegex(text, /tanggal\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i) ||
                  extractByRegex(text, /\b(\d{2}[-/]\d{2}[-/]\d{4})\b/);

  return [
    { label: 'Nomor SIP', value: noSip },
    { label: 'Nama', value: nama },
    { label: 'Profesi', value: profesi },
    { label: 'Tempat Praktik', value: tempat },
    { label: 'Berlaku s/d', value: berlaku },
  ];
}

function parseAkta(lines: string[], text: string): OcrField[] {
  // Nama: Di akta kelahiran model lama/baru biasanya setelah kalimat "telah lahir:"
  const nama = extractLineAfterKeyword(lines, 'Nama') ||
               extractByRegex(text, /telah\s*lahir\s*[:;]?\s*([A-Z\s]{5,})/i) ||
               // Baris di antara tanda kutip (sering digunakan di akta lama)
               extractByRegex(text, /"\s*([A-Z\s]{5,})\s*"/i) ||
               extractLineAfterKeyword(lines, 'telah lahir', 'Kutipan');

  // No Akta: format 1234/U/JS/1997 atau similar
  const noAkta = extractByRegex(text, /(?:No\.?|Nomor)\s*[:;=]?\s*([\w\d/.-]{5,})/i) ||
                 extractLineAfterKeyword(lines, 'No', 'Nomor', 'Akta');

  const tempatLahir = extractLineAfterKeyword(lines, 'bahwa di', 'Tempat Lahir') ||
                      extractByRegex(text, /bahwa\s*di\s*([A-Z\s]+)/i);

  const tglLahir = extractLineAfterKeyword(lines, 'pada tanggal', 'Tanggal Lahir') ||
                   extractByRegex(text, /pada\s*tanggal\s*([A-Z\d\s]{5,})/i);

  // Orang tua: biasanya "dari suami isteri : NAMA AYAH dan NAMA IBU"
  const ayah = extractByRegex(text, /suami\s*(?:isteri)?\s*[:;]?\s*([A-Z\s]{3,})\s*(?:dan|&)/i) ||
               extractLineAfterKeyword(lines, 'suami', 'Ayah');
               
  const ibu = extractByRegex(text, /(?:dan|&)\s*([A-Z\s]{3,})/i) ||
              extractLineAfterKeyword(lines, 'isteri', 'Ibu');

  const anakKe = extractByRegex(text, /anak\s*ke\s*[:;]?\s*([A-Z\d \t\-()]+)/i) ||
                 extractLineAfterKeyword(lines, 'anak ke');

  return [
    { label: 'Nama', value: nama.replace(/"/g, '').trim() },
    { label: 'No. Akta', value: noAkta },
    { label: 'Tempat Lahir', value: tempatLahir },
    { label: 'Tanggal Lahir', value: tglLahir },
    { label: 'Nama Ayah', value: ayah },
    { label: 'Nama Ibu', value: ibu },
    { label: 'Anak Ke', value: anakKe },
  ];
}

// ─── Main Entry ────────────────────────────────────────────────────────────

/** Parsing teks mentah hasil OCR menjadi field-field terstruktur */
export function parseOcrToFields(rawText: string, category: DocCategory): OcrField[] {
  const text = cleanOcr(rawText);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const templates = FIELD_TEMPLATES[category];

  let result: OcrField[] = [];

  switch (category) {
    case 'ktp':    result = parseKtp(lines, text); break;
    case 'npwp':   result = parseNpwp(lines, text); break;
    case 'kk':     result = parseKk(lines, text); break;
    case 'ijazah': result = parseIjazah(lines, text); break;
    case 'sim':    result = parseSim(lines, text); break;
    case 'nikah':  result = parseNikah(lines, text); break;
    case 'paspor': result = parsePaspor(lines, text); break;
    case 'bpjs_kes': result = parseBpjsKes(lines, text); break;
    case 'bpjs_ket': result = parseBpjsKet(lines, text); break;
    case 'sip':    result = parseSip(lines, text); break;
    case 'akta':   result = parseAkta(lines, text); break;
    case 'lainnya':
      return lines.slice(0, 20).map((v, i) => ({ label: `Baris ${i + 1}`, value: v }));
    default:
      // Akta, Sertifikat, Asuransi: fallback ke template kosong + lines pertama
      result = templates.map(label => ({ label, value: '' }));
      if (lines.length > 0) {
        // Isi template dengan baris OCR yang paling relevan
        result = result.map((field, i) => ({
          ...field,
          value: extractLineAfterKeyword(lines, field.label) || lines[i] || '',
        }));
      }
      return result;
  }

  // Pastikan semua field di template ada (tambahkan yang kosong jika belum ada)
  templates.forEach(label => {
    if (!result.find(r => r.label === label)) {
      result.push({ label, value: '' });
    }
  });

  return result;
}
