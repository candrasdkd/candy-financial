import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRegister } from '../useRegister';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useRegister', () => {
  const mockRegister = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockImplementation((selector: any) => selector({ register: mockRegister }));
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('seharusnya melakukan registrasi dan navigasi ke dashboard jika berhasil', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useRegister());

    // Step 1: Email & Password
    await act(async () => {
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.step).toBe(2);

    // Step 2: Profile Info
    await act(async () => {
      result.current.setDisplayName('Test User');
      result.current.setGender('male');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User', 'male');
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(result.current.loading).toBe(false);
  });

  it('seharusnya menangkap error jika registrasi gagal', async () => {
    mockRegister.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const { result } = renderHook(() => useRegister());

    // Lewati Step 1
    await act(async () => {
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setStep(2); // Set step langsung ke 2
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe('Email sudah terdaftar. Silakan gunakan email lain.');
    expect(result.current.loading).toBe(false);
  });

});
