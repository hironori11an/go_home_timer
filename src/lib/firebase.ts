import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

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

// User Agent判定関数
function isAndroidChrome() {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent;
  return userAgent.includes('Android') && userAgent.includes('Chrome');
}

export async function confirmNotification() {
  
  // ブラウザ環境でない場合は早期リターン
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
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

    // Service Workerを登録
    let registration;
    try {
      
      // Android Chrome の場合はデフォルトスコープを使用
      const swOptions = isAndroidChrome() 
        ? { scope: '/' }  // Android Chrome では広いスコープを使用
        : { scope: '/firebase-cloud-messaging-push-scope' };
      
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', swOptions);
      
      // Service Workerが有効になるまで待つ
      await navigator.serviceWorker.ready;
      
    } catch (swError) {
      console.error('Service Worker registration failed:', swError);
      throw new Error(`Service Workerの登録に失敗しました: ${swError instanceof Error ? swError.message : String(swError)}`);
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
      return token;
    } else {
      throw new Error('FCMトークンの取得に失敗しました');
    }
    
  } catch (error) {
    console.error('=== Notification setup failed ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export { firebaseApp, messaging }; 