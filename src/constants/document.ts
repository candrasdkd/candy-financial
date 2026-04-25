import { DocCategory } from '../types/document';

export const CATEGORY_INFO: Record<DocCategory, { label: string; emoji: string; color: string }> = {
  ktp: { label: 'KTP', emoji: '🪪', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  sim: { label: 'SIM', emoji: '🚗', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  npwp: { label: 'NPWP', emoji: '💳', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  nikah: { label: 'Buku Nikah', emoji: '💍', color: 'bg-pink-50 text-pink-700 border-pink-100' },
  ijazah: { label: 'Ijazah', emoji: '🎓', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  akta: { label: 'Akta', emoji: '📜', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  paspor: { label: 'Paspor', emoji: '✈️', color: 'bg-green-50 text-green-700 border-green-100' },
  kk: { label: 'Kartu Keluarga', emoji: '👨‍👩‍👧', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  sertifikat: { label: 'Sertifikat', emoji: '🏅', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  bpjs_kes: { label: 'BPJS Kesehatan', emoji: '🏥', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  bpjs_ket: { label: 'BPJS Ketenagakerjaan', emoji: '👷', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  asuransi: { label: 'Asuransi', emoji: '🛡️', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  sip: { label: 'SIP / SIPA', emoji: '🩺', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  lainnya: { label: 'Lainnya', emoji: '📁', color: 'bg-sage-50 text-sage-700 border-sage-100' },
};

export const FIELD_TEMPLATES: Record<DocCategory, string[]> = {
  ktp: ['NIK', 'Nama', 'Tempat/Tgl Lahir', 'Jenis Kelamin', 'Gol. Darah', 'Alamat', 'RT/RW', 'Kel/Desa', 'Kecamatan', 'Agama', 'Status Perkawinan', 'Pekerjaan', 'Berlaku Hingga'],
  sim: ['Nomor SIM', 'Nama', 'Tempat/Tgl Lahir', 'Alamat', 'Berlaku s/d'],
  npwp: ['NPWP', 'Nama', 'NIK', 'Alamat', 'KPP'],
  nikah: ['No. Buku Nikah', 'Nama Suami', 'Nama Istri', 'Tanggal Nikah', 'KUA'],
  paspor: ['No. Paspor', 'Nama', 'Kewarganegaraan', 'Tempat/Tgl Lahir', 'Jenis Kelamin', 'Berlaku s/d'],
  kk: ['No. KK', 'Kepala Keluarga', 'Alamat', 'RT/RW', 'Kel/Desa', 'Kecamatan', 'Kabupaten/Kota', 'Provinsi'],
  ijazah: ['Nama', 'Nomor Ijazah', 'Sekolah/Universitas', 'Program Studi', 'Tahun Lulus'],
  akta: ['Nama', 'No. Akta', 'Tempat Lahir', 'Tanggal Lahir', 'Anak Ke', 'Nama Ayah', 'Nama Ibu'],
  sertifikat: ['Nama', 'No. Sertifikat', 'Nama Sertifikat', 'Lembaga Penerbit', 'Tanggal Terbit'],
  bpjs_kes: ['No. Kartu', 'Nama', 'NIK', 'Faskes Tingkat I'],
  bpjs_ket: ['No. Peserta', 'Nama', 'NIK', 'Nama Perusahaan'],
  asuransi: ['No. Polis', 'Nama Tertanggung', 'Nama Asuransi', 'Masa Berlaku'],
  sip: ['Nomor SIP', 'Nama', 'Profesi', 'Tempat Praktik', 'Berlaku s/d'],
  lainnya: [],
};
