import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLogin } from '../useLogin';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

// Mocking hooks
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('useLogin', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockImplementation((selector: any) => selector({ login: mockLogin }));
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  it('seharusnya melakukan login dan navigasi ke dashboard jika berhasil', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(mockLogin).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('seharusnya menangkap error jika login gagal', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe('Email atau password salah');
    expect(result.current.loading).toBe(false);
  });
});
