import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { usePWAStore } from '../store/usePWAStore';

export function useSettingsPage() {
  const { userProfile, logout, linkCouple, updateUserProfile } = useAuthStore();
  const { confirm, close, setLoading: setConfirmLoading } = useConfirmStore();
  const { deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled } = usePWAStore();

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
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
