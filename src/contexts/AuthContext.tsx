import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  linkCouple: (inviteCode: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data() as UserProfile;
    return null;
  }

  async function refreshProfile() {
    if (currentUser) {
      const profile = await fetchProfile(currentUser.uid);
      setUserProfile(profile);
    }
  }

  async function register(email: string, password: string, displayName: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    const inviteCode = generateInviteCode();
    const profile: UserProfile = {
      uid: user.uid,
      email,
      displayName,
      coupleId: null,
      partnerEmail: null,
      inviteCode,
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    setUserProfile(profile);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function linkCouple(inviteCode: string) {
    if (!currentUser || !userProfile) throw new Error('Tidak ada user');
    if (userProfile.coupleId) throw new Error('Sudah terhubung dengan pasangan');

    // Find partner by invite code
    const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Kode undangan tidak ditemukan');

    const partnerDoc = snap.docs[0];
    const partnerData = partnerDoc.data() as UserProfile;

    if (partnerData.uid === currentUser.uid) throw new Error('Tidak bisa menghubungkan dengan diri sendiri');
    if (partnerData.coupleId) throw new Error('Pasangan sudah terhubung dengan orang lain');

    // Create couple document
    const coupleRef = await addDoc(collection(db, 'couples'), {
      members: [currentUser.uid, partnerData.uid],
      createdAt: new Date().toISOString(),
    });

    // Update both users
    await updateDoc(doc(db, 'users', currentUser.uid), {
      coupleId: coupleRef.id,
      partnerEmail: partnerData.email,
    });
    await updateDoc(doc(db, 'users', partnerData.uid), {
      coupleId: coupleRef.id,
      partnerEmail: currentUser.email,
    });

    await refreshProfile();
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, userProfile, loading, register, login, logout, linkCouple, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
