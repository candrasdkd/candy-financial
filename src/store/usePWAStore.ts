import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (installed: boolean) => void;
}

export const usePWAStore = create<PWAStore>((set) => ({
  deferredPrompt: null,
  isInstalled: window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsInstalled: (installed) => set({ isInstalled: installed }),
}));
