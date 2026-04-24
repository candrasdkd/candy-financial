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
  addDoc,
  onSnapshot
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
  register: (email: string, password: string, displayName: string, gender: 'male' | 'female') => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  linkCouple: (inviteCode: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string, gender?: 'male' | 'female' }) => Promise<void>;
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
    let profileUnsub: (() => void) | null = null;
    let partnerUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      set({ currentUser: user, initialized: true });
      
      if (profileUnsub) profileUnsub();
      if (partnerUnsub) partnerUnsub();
      profileUnsub = null;
      partnerUnsub = null;

      if (user) {
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            set({ userProfile: profile });

            // If linked to a partner, listen to partner's profile for real-time name/avatar sync
            if (profile.partnerEmail && !partnerUnsub) {
              const q = query(
                collection(db, 'users'), 
                where('email', '==', profile.partnerEmail)
              );
              partnerUnsub = onSnapshot(q, (partnerSnap) => {
                if (!partnerSnap.empty) {
                  const partnerData = partnerSnap.docs[0].data() as UserProfile;
                  set((state) => ({
                    userProfile: state.userProfile ? {
                      ...state.userProfile,
                      partnerName: partnerData.displayName
                    } : null
                  }));
                }
              });
            }
          }
          set({ loading: false });
        });
      } else {
        set({ userProfile: null, loading: false });
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
      if (partnerUnsub) partnerUnsub();
    };
  },

  register: async (email, password, displayName, gender) => {
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
      gender,
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
  },

  updateUserProfile: async (data) => {
    const { currentUser, userProfile } = get();
    if (!currentUser || !userProfile) throw new Error('Tidak ada user');

    // Update Firestore
    await updateDoc(doc(db, 'users', currentUser.uid), data as any);

    // Update Firebase Auth if displayName changed
    if (data.displayName) {
      await updateProfile(currentUser, { displayName: data.displayName });

      // Sync partner's partnerName if they are linked
      if (userProfile.partnerEmail) {
        try {
          const q = query(
            collection(db, 'users'), 
            where('email', '==', userProfile.partnerEmail)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const partnerDoc = snap.docs[0];
            await updateDoc(doc(db, 'users', partnerDoc.id), {
              partnerName: data.displayName
            });
          }
        } catch (e) {
          console.error('Failed to sync name to partner', e);
        }
      }
    }

    // Update local state
    set({
      userProfile: { ...userProfile, ...data }
    });
  }
}));
