import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { usePWAStore } from '../store/usePWAStore';

export function useSettingsPage() {
  const { userProfile, logout, linkCouple, updateUserProfile } = useAuthStore();
  const { confirm, close, setLoading: setConfirmLoading } = useConfirmStore();
  const { deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled } = usePWAStore();

  // Deteksi iOS yang benar: cek iPad/iPhone/iPod, BUKAN 'Safari' (ada di Android UA juga!)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleInstallApp = async () => {
    // Android (dan browser lain): gunakan native install prompt
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
      return;
    }

    // Fallback: tampilkan panduan manual sesuai platform
    if (!isInstalled) {
      const message = isIOS
        ? 'Untuk menginstall di iOS:\n1. Tap ikon Share (□↑) di browser\n2. Pilih "Add to Home Screen"\n3. Tap "Add" untuk konfirmasi'
        : 'Untuk menginstall di Android:\n1. Buka menu browser (titik tiga ⋮)\n2. Pilih "Install app" atau "Add to Home Screen"';

      confirm({
        title: '📱 Install CandyNest',
        message,
        confirmText: 'Mengerti',
        variant: 'info',
        onConfirm: () => close(),
      });
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
    // Tampilkan tombol install jika: ada native prompt ATAU device iOS yang belum install
    // Android tanpa deferredPrompt = tombol tidak muncul (event belum/tidak dipicu browser)
    canInstall: !!deferredPrompt || (isIOS && !isInstalled)
  };
}
