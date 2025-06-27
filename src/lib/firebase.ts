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
      throw new Error(`通知許可が拒否されました。現在の状態: ${permission}`);
    }

    // Service Workerを登録
    let registration;
    try {
      // 既存のService Worker登録をチェック
      const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (existingRegistration) {
        registration = existingRegistration;
      } else {
        // スコープを統一して問題を避ける
        const swOptions = { scope: '/' };
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', swOptions);
      }
      
      // Service Workerが有効になるまで待つ（タイムアウト付き）
      try {
        // 10秒のタイムアウトを設定
        const readyPromise = navigator.serviceWorker.ready;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service Worker ready timeout')), 10000)
        );
        
        await Promise.race([readyPromise, timeoutPromise]);
        
      } catch (readyError) {
        // タイムアウトしても処理を継続
        console.warn('Service Worker ready timeout, continuing anyway...', readyError);
      }
      
      // Service Worker内でのFirebase初期化完了をより確実に待つ
      let retryCount = 0;
      const maxRetries = 6; // 3秒まで短縮
      
      while (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms待機
        
        // Service Workerの状態をチェック
        if (registration.active && registration.active.state === 'activated') {
          break;
        }
        
        retryCount++;
      }
      
    } catch (swError) {
      console.error('Service Worker registration failed:', swError);
      throw new Error(`Service Workerの登録に失敗しました: ${swError instanceof Error ? swError.message : String(swError)}`);
    }

    // FCMトークンを取得
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      throw new Error('VAPID キーが設定されていません（NEXT_PUBLIC_FIREBASE_VAPID_KEY）');
    }

    // トークン取得のリトライ
    let token;
    let tokenRetryCount = 0;
    const maxTokenRetries = 3;
    
    while (tokenRetryCount < maxTokenRetries) {
      try {
        token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });
        
        if (token) {
          break;
        }
        
        throw new Error('トークンが取得できませんでした（空のレスポンス）');
        
      } catch (tokenError) {
        tokenRetryCount++;
        console.error(`Token retrieval attempt ${tokenRetryCount} failed:`, tokenError);
        
        if (tokenRetryCount >= maxTokenRetries) {
          throw tokenError;
        }
        
        // 1秒待ってからリトライ
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (token) {
      return token;
    } else {
      throw new Error('FCMトークンの取得に失敗しました（リトライ後）');
    }
    
  } catch (error) {
    console.error('Notification setup failed:', error);
    throw error;
  }
}

export { firebaseApp, messaging }; 