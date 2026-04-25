import { describe, it, expect } from 'vitest';
import { parseOcrToFields } from '../document';

describe('Document Utils - OCR Parsing', () => {
  describe('parseOcrToFields - Akta Kelahiran', () => {
    it('seharusnya mengekstrak data Akta Kelahiran model lama dengan benar', () => {
      const mockOcrText = `
        PENCATATAN SIPIL
        KUTIPAN AKTA KELAHIRAN
        No. 22282/U/JS/1997
        bahwa di Jakarta
        pada tanggal tujuh Nopember
        seribu sembilanratus sembilanpuluh tujuh
        telah lahir:
        " CANDRA SIDIK DERMAWAN "
        anak ke dua laki-laki dari suami isteri : SUTOYO dan ISWATUN
      `;

      const fields = parseOcrToFields(mockOcrText, 'akta');
      
      const getVal = (label: string) => fields.find(f => f.label === label)?.value;

      expect(getVal('Nama')).toBe('CANDRA SIDIK DERMAWAN');
      expect(getVal('No. Akta')).toBe('22282/U/JS/1997');
      expect(getVal('Tempat Lahir')).toBe('Jakarta');
      expect(getVal('Nama Ayah')).toBe('SUTOYO');
      expect(getVal('Nama Ibu')).toBe('ISWATUN');
      expect(getVal('Anak Ke')).toContain('dua');
    });

    it('seharusnya mengekstrak data Akta Kelahiran model baru (tanpa kutip)', () => {
      const mockOcrText = `
        KUTIPAN AKTA KELAHIRAN
        NOMOR: 3276-LU-12052021-0001
        Nama: BUDI SANTOSO
        Tempat Lahir: DEPOK
        Tanggal Lahir: 12 MEI 2021
        Anak Ke: 1 (SATU)
        Ayah: AHMAD
        Ibu: SITI
      `;

      const fields = parseOcrToFields(mockOcrText, 'akta');
      
      const getVal = (label: string) => fields.find(f => f.label === label)?.value;

      expect(getVal('Nama')).toBe('BUDI SANTOSO');
      expect(getVal('No. Akta')).toBe('3276-LU-12052021-0001');
      expect(getVal('Tempat Lahir')).toBe('DEPOK');
      expect(getVal('Anak Ke')).toBe('1 (SATU)');
    });
  });

  describe('parseOcrToFields - KTP', () => {
    it('seharusnya mengekstrak NIK dan Nama dari teks KTP', () => {
      const mockOcrText = `
        PROVINSI JAWA BARAT
        KOTA DEPOK
        NIK : 3276012345678901
        Nama : CANDRA SIDIK
        Tempat/Tgl Lahir : JAKARTA, 01-01-1990
        Alamat : JL. RAYA SAGE NO. 1
      `;

      const fields = parseOcrToFields(mockOcrText, 'ktp');
      
      const getVal = (label: string) => fields.find(f => f.label === label)?.value;

      expect(getVal('NIK')).toBe('3276012345678901');
      expect(getVal('Nama')).toBe('CANDRA SIDIK');
    });
  });
});
