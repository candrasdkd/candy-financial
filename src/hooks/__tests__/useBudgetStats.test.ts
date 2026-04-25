import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBudgetStats } from '../useBudgetStats';
import { Transaction } from '../../types';

describe('useBudgetStats', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      amount: 100000,
      type: 'expense',
      category: 'makan',
      date: '2026-04-05',
      description: 'Makan Siang',
      addedBy: 'User',
      coupleId: 'couple1',
      userId: 'user1',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      amount: 200000,
      type: 'expense',
      category: 'makan',
      date: '2026-04-10',
      description: 'Makan Malam',
      addedBy: 'User',
      coupleId: 'couple1',
      userId: 'user1',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      amount: 500000,
      type: 'expense',
      category: 'transport',
      date: '2026-04-15',
      description: 'Bensin',
      addedBy: 'User',
      coupleId: 'couple1',
      userId: 'user1',
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      amount: 1000000,
      type: 'income',
      category: 'gaji',
      date: '2026-04-01',
      description: 'Gaji',
      addedBy: 'User',
      coupleId: 'couple1',
      userId: 'user1',
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      amount: 300000,
      type: 'expense',
      category: 'makan',
      date: '2026-05-01', // Bulan berbeda
      description: 'Makan Mei',
      addedBy: 'User',
      coupleId: 'couple1',
      userId: 'user1',
      createdAt: new Date().toISOString()
    }
  ];

  it('seharusnya menghitung pengeluaran per kategori dengan benar untuk bulan tertentu', () => {
    const { result } = renderHook(() => useBudgetStats(mockTransactions, '2026-04'));

    expect(result.current.expenseByCategory['makan']).toBe(300000); // 100rb + 200rb
    expect(result.current.expenseByCategory['transport']).toBe(500000);
    expect(result.current.expenseByCategory['gaji']).toBeUndefined(); // Income tidak dihitung
  });

  it('seharusnya mengabaikan transaksi di luar bulan yang ditentukan', () => {
    const { result } = renderHook(() => useBudgetStats(mockTransactions, '2026-04'));
    
    // Transaksi ID 5 (Mei) tidak boleh masuk ke April
    expect(result.current.expenseByCategory['makan']).not.toBe(600000);
  });

  it('seharusnya mengembalikan objek kosong jika tidak ada transaksi', () => {
    const { result } = renderHook(() => useBudgetStats([], '2026-04'));
    expect(result.current.expenseByCategory).toEqual({});
  });
});
