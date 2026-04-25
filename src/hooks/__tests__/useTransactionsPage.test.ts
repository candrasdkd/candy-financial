import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransactionsPage } from '../useTransactionsPage';
import { useTransactions } from '../useTransactions';
import { useAuthStore } from '../../store/useAuthStore';

// Mock dependencies
vi.mock('../useTransactions', () => ({
  useTransactions: vi.fn()
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../../store/useConfirmStore', () => ({
  useConfirmStore: vi.fn(() => ({
    confirm: vi.fn(),
    close: vi.fn(),
    setLoading: vi.fn()
  }))
}));

describe('useTransactionsPage', () => {
  const mockTransactions = [
    { id: '1', amount: 100000, type: 'income', category: 'gaji', date: '2026-04-01', description: 'Gaji', addedBy: 'User', coupleId: 'c1', userId: 'u1' },
    { id: '2', amount: 50000, type: 'expense', category: 'makan', date: '2026-04-02', description: 'Bakso', addedBy: 'User', coupleId: 'c1', userId: 'u1' },
    { id: '3', amount: 200000, type: 'expense', category: 'transport', date: '2026-04-10', description: 'Bensin', addedBy: 'User', coupleId: 'c1', userId: 'u1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ displayName: 'User' });
    (useTransactions as any).mockReturnValue({
      transactions: mockTransactions,
      loading: false,
      error: null,
      deleteTransaction: vi.fn()
    });
  });

  it('seharusnya menghitung total income dan expense dengan benar', () => {
    const { result } = renderHook(() => useTransactionsPage());
    
    expect(result.current.totalIncome).toBe(100000);
    expect(result.current.totalExpense).toBe(250000);
  });

  it('seharusnya memfilter berdasarkan pencarian (deskripsi)', () => {
    const { result } = renderHook(() => useTransactionsPage());
    
    act(() => {
      result.current.setSearch('Bakso');
    });

    expect(result.current.totalExpense).toBe(50000);
    expect(result.current.grouped).toHaveLength(1);
  });

  it('seharusnya memfilter berdasarkan tipe (expense)', () => {
    const { result } = renderHook(() => useTransactionsPage());
    
    act(() => {
      result.current.setFilterType('expense');
    });

    expect(result.current.totalIncome).toBe(0);
    expect(result.current.totalExpense).toBe(250000);
  });

  it('seharusnya mengelompokkan transaksi berdasarkan tanggal', () => {
    const { result } = renderHook(() => useTransactionsPage());
    
    // Ada 3 tanggal berbeda: 01, 02, 10
    expect(result.current.grouped).toHaveLength(3);
    expect(result.current.grouped[0][0]).toBe('2026-04-10'); // Urutan terbaru
  });
});
