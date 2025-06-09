import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

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

// クライアントサイドでのみMessagingを初期化
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  messaging = getMessaging(firebaseApp);
}

export async function confirmNotification() {
  // ブラウザ環境でない場合は早期リターン
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported or not in browser environment');
    return null;
  }

  // messagingが初期化されていない場合は初期化
  if (!messaging) {
    messaging = getMessaging(firebaseApp);
  }

  try {
    // 通知許可をリクエスト
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('通知許可が拒否されました');
    }

    console.log('Notification permission granted.');

    // Service Workerを登録
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Service Workerが有効になるまで待つ
      await navigator.serviceWorker.ready;
    } catch (swError) {
      console.error('Service Worker registration failed:', swError);
      throw new Error('Service Workerの登録に失敗しました');
    }

    // FCMトークンを取得
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID キーが設定されていません');
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });
    
    if (token) {
      // フォアグラウンドメッセージハンドラーを設定
      setupForegroundMessageHandler();
      return token;
    } else {
      throw new Error('FCMトークンの取得に失敗しました');
    }
    
  } catch (error) {
    console.error('Notification setup failed:', error);
    throw error;
  }
}

// フォアグラウンドでのメッセージ受信処理
function setupForegroundMessageHandler() {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // ページがアクティブな時は手動で通知を表示
    if (payload.notification) {
      const notificationOptions: NotificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon.png',
        data: payload.data,
        tag: 'go-home-timer',
        requireInteraction: true,
      };

      const notification = new Notification(
        payload.notification.title || 'お知らせ', 
        notificationOptions
      );

      // 通知クリック時の処理
      notification.onclick = () => {
        notification.close();
        window.focus();
      };
    }
  });
}

export { firebaseApp, messaging }; 