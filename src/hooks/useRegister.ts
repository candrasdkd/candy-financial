import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function useRegister() {
  const registerStore = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextStep = () => {
    if (email && password.length >= 6) {
      setStep(2);
      setError('');
    } else if (password.length < 6) {
      setError('Password minimal 6 karakter');
    } else {
      setError('Harap isi semua bidang');
    }
  };

  const prevStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If on step 1, just go to step 2
    if (step === 1) {
      nextStep();
      return;
    }
    
    // Final registration
    setError('');
    setLoading(true);
    try {
      await registerStore(email, password, displayName, gender);
      navigate('/');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email sudah terdaftar. Silakan gunakan email lain.'
        : err.code === 'auth/invalid-email'
        ? 'Format email tidak valid'
        : err.message || 'Terjadi kesalahan saat mendaftar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    setStep,
    email,
    setEmail,
    password,
    setPassword,
    displayName,
    setDisplayName,
    gender,
    setGender,
    loading,
    error,
    handleSubmit,
    nextStep,
    prevStep
  };
}
