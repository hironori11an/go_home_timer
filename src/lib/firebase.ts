import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

export async function confirmNotification() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js`);
      console.log('Service Worker registered with scope:', registration.scope);

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPIDKEY,
          serviceWorkerRegistration: registration,
        });
        
        if (token) {
          console.log('FCM Token:', token);
          // フォアグラウンドメッセージハンドラーを設定
          setupForegroundMessageHandler();
          // TODO: FCMトークンをDBに保存する
          return token;
        }
      } 
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
  return null;
}

// フォアグラウンドでのメッセージ受信処理
function setupForegroundMessageHandler() {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // ページがアクティブな時は手動で通知を表示
    if (payload.notification) {
      const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon.png',
        badge: payload.notification.badge || '/badge.png',
        data: payload.data,
        actions: payload.webpush?.notification?.actions || []
      };

      new Notification(payload.notification.title, notificationOptions);
    }
  });
}

export { firebaseApp, messaging }; 