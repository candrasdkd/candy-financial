import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const INSTALL_DISMISSED_KEY = 'pwa_install_dismissed';

/** Safe check: apakah app berjalan dalam mode standalone (terinstall) */
function detectIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/** Apakah user pernah dismiss banner install */
export function getInstallDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setInstallDismissed(): void {
  try {
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

interface PWAStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (installed: boolean) => void;
}

export const usePWAStore = create<PWAStore>((set) => ({
  deferredPrompt: null,
  isInstalled: detectIsInstalled(),
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsInstalled: (installed) => set({ isInstalled: installed }),
}));
