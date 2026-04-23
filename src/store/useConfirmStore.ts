import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isLoading: boolean;
  confirmText: string;
  variant: 'danger' | 'info' | 'success';
  
  // Actions
  confirm: (options: { 
    title: string; 
    message: string; 
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    variant?: 'danger' | 'info' | 'success';
  }) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
  isLoading: false,
  confirmText: 'Hapus',
  variant: 'danger',

  confirm: ({ title, message, onConfirm, confirmText = 'Hapus', variant = 'danger' }) => {
    set({ isOpen: true, title, message, onConfirm, isLoading: false, confirmText, variant });
  },
  
  close: () => {
    set({ isOpen: false });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  }
}));
