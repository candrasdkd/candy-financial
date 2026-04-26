import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { messaging, db } from '../firebase';

// src/utils/notifications.ts
export const requestNotificationPermission = async (userId: string) => {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // FIX: Tunggu SW ready sebelum getToken - ini race condition sebelumnya
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready, // explicit
    });

    if (token) {
      const userRef = doc(db, 'users', userId);
      // FIX: Simpan dengan timestamp untuk cleanup stale tokens nanti
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
      return token;
    }
  } catch (error) {
    // Jangan crash app kalau notif gagal (user bisa blokir, dll)
    console.warn('Notification token skipped:', error);
  }
  return null;
};
