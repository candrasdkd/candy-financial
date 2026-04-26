import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { messaging, db } from '../firebase';

export const requestNotificationPermission = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (token) {
        // Save token to Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        return token;
      }
    }
  } catch (error) {
    console.error('Error getting notification token:', error);
  }
  return null;
};
