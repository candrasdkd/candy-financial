import { describe, it, expect } from 'vitest';
import { formatRupiah, parseRupiah, MAX_AMOUNT, getCategoryInfo } from './index';

describe('Financial Utilities', () => {
  describe('formatRupiah', () => {
    it('seharusnya memformat angka ke mata uang Rupiah tanpa desimal', () => {
      // Note: Menggunakan \u00a0 untuk non-breaking space yang biasanya dihasilkan Intl.NumberFormat
      expect(formatRupiah(1000000).replace(/\u00a0/g, ' ')).toBe('Rp 1.000.000');
      expect(formatRupiah(50000).replace(/\u00a0/g, ' ')).toBe('Rp 50.000');
      expect(formatRupiah(0).replace(/\u00a0/g, ' ')).toBe('Rp 0');
    });
  });

  describe('parseRupiah', () => {
    it('seharusnya mengekstrak angka dari string berformat rupiah', () => {
      expect(parseRupiah('1.000.000')).toBe(1000000);
      expect(parseRupiah('Rp 50.000')).toBe(50000);
      expect(parseRupiah('150,000')).toBe(150000);
      expect(parseRupiah('abc123xyz')).toBe(123);
    });

    it('seharusnya mengembalikan 0 jika input kosong atau tidak mengandung angka', () => {
      expect(parseRupiah('')).toBe(0);
      expect(parseRupiah('abc')).toBe(0);
    });
  });

  describe('MAX_AMOUNT', () => {
    it('seharusnya memiliki nilai 100.000.000', () => {
      expect(MAX_AMOUNT).toBe(100_000_000);
    });
  });

  describe('getCategoryInfo', () => {
    it('seharusnya mengembalikan info kategori yang benar untuk ID yang valid', () => {
      const info = getCategoryInfo('gaji');
      expect(info.label).toBe('Gaji');
      expect(info.value).toBe('gaji');
    });

    it('seharusnya mengembalikan fallback untuk ID kategori yang tidak dikenal', () => {
      // @ts-ignore
      const info = getCategoryInfo('kategori_palsu');
      expect(info.label).toBe('kategori_palsu');
    });
  });
});
