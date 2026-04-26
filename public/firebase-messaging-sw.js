importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBqNrKW4Mq_Dlwpt3RPWyFJf0loaUoFiBE",
  authDomain: "candyfinancial-16cde.firebaseapp.com",
  projectId: "candyfinancial-16cde",
  storageBucket: "candyfinancial-16cde.firebasestorage.app",
  messagingSenderId: "148928117212",
  appId: "1:148928117212:web:8927bd97983abc393f7719",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
