import { create } from 'zustand';
import { 
  User, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { useDataStore } from './useDataStore';

interface AuthState {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  init: () => () => void;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  linkCouple: (inviteCode: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  userProfile: null,
  loading: true,
  initialized: false,

  init: () => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      set({ currentUser: user, initialized: true });
      
      if (user) {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (profileSnap.exists()) {
          let profile = profileSnap.data() as UserProfile;
          
          // Auto-sync partnerName if missing
          if (profile.coupleId && !profile.partnerName && profile.partnerEmail) {
            try {
              const q = query(collection(db, 'users'), where('email', '==', profile.partnerEmail));
              const snap = await getDocs(q);
              if (!snap.empty) {
                const partnerData = snap.docs[0].data() as UserProfile;
                await updateDoc(doc(db, 'users', user.uid), {
                  partnerName: partnerData.displayName
                });
                profile = { ...profile, partnerName: partnerData.displayName };
              }
            } catch (e) {
              console.error('Failed to sync partner name', e);
            }
          }
          set({ userProfile: profile });
        }
      } else {
        set({ userProfile: null });
      }
      set({ loading: false });
    });
    return unsub;
  },

  register: async (email, password, displayName) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    
    const inviteCode = generateInviteCode();
    const profile: UserProfile = {
      uid: user.uid,
      email,
      displayName,
      coupleId: null,
      partnerEmail: null,
      partnerName: null,
      inviteCode,
    };
    
    await setDoc(doc(db, 'users', user.uid), profile);
    set({ userProfile: profile });
  },

  login: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },

  logout: async () => {
    await signOut(auth);
    useDataStore.getState().clearData();
    set({ currentUser: null, userProfile: null });
  },

  refreshProfile: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) set({ userProfile: snap.data() as UserProfile });
  },

  linkCouple: async (inviteCode) => {
    const { currentUser, userProfile, refreshProfile } = get();
    if (!currentUser || !userProfile) throw new Error('Tidak ada user');
    if (userProfile.coupleId) throw new Error('Sudah terhubung dengan pasangan');

    // Find partner
    const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Kode undangan tidak ditemukan');

    const partnerDoc = snap.docs[0];
    const partnerData = partnerDoc.data() as UserProfile;

    if (partnerData.uid === currentUser.uid) throw new Error('Tidak bisa menghubungkan dengan diri sendiri');
    if (partnerData.coupleId) throw new Error('Pasangan sudah terhubung dengan orang lain');

    // Create couple
    const coupleRef = await addDoc(collection(db, 'couples'), {
      members: [currentUser.uid, partnerData.uid],
      createdAt: new Date().toISOString(),
    });

    // Update current user
    await updateDoc(doc(db, 'users', currentUser.uid), {
      coupleId: coupleRef.id,
      partnerEmail: partnerData.email,
      partnerName: partnerData.displayName
    });

    // Update partner
    await updateDoc(doc(db, 'users', partnerData.uid), {
      coupleId: coupleRef.id,
      partnerEmail: currentUser.email,
      partnerName: userProfile.displayName
    });

    await refreshProfile();
  }
}));
