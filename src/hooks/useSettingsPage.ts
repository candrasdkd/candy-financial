import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useConfirmStore } from '../store/useConfirmStore';

// Define a type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useSettingsPage() {
  const { userProfile, logout, linkCouple, updateUserProfile } = useAuthStore();
  const { confirm, close, setLoading: setConfirmLoading } = useConfirmStore();

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Logic for iOS or others where prompt isn't supported
      if (!isInstalled) {
        alert('Untuk menginstall CandyNest:\n1. Klik tombol Share di browser\n2. Pilih "Add to Home Screen"');
      }
      return;
    }
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  // Invite & Link State
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile?.displayName || '');
  const [editGender, setEditGender] = useState(userProfile?.gender || 'male');
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const copyCode = () => {
    if (userProfile?.inviteCode) {
      navigator.clipboard.writeText(userProfile.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCode) return;
    setLinking(true);
    setLinkError('');
    setLinkSuccess('');
    try {
      await linkCouple(inviteCode.toUpperCase().trim());
      setLinkSuccess('Berhasil terhubung!');
      setInviteCode('');
    } catch (err: any) {
      setLinkError(err.message || 'Gagal menghubungkan');
    } finally {
      setLinking(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    setUpdateError('');
    try {
      await updateUserProfile({
        displayName: editName,
        gender: editGender as 'male' | 'female'
      });
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: 'Keluar Aplikasi',
      message: 'Apakah Anda yakin ingin keluar?',
      onConfirm: async () => {
        setConfirmLoading(true);
        await logout();
        close();
      }
    });
  };

  return {
    userProfile,
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    editGender,
    setEditGender,
    saving,
    updateError,
    inviteCode,
    setInviteCode,
    linking,
    linkError,
    linkSuccess,
    copied,
    copyCode,
    handleLink,
    handleUpdateProfile,
    handleLogout,
    handleInstallApp,
    isInstalled,
    canInstall: !!deferredPrompt || (!isInstalled && /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent))
  };
}
