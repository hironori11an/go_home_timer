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

// User Agent判定関数
function isAndroidChrome() {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent;
  return userAgent.includes('Android') && userAgent.includes('Chrome');
}

export async function confirmNotification() {
  console.log('=== confirmNotification started ===');
  console.log('User Agent:', typeof window !== 'undefined' ? navigator.userAgent : 'N/A');
  console.log('Is Android Chrome:', isAndroidChrome());
  
  // ブラウザ環境でない場合は早期リターン
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported or not in browser environment');
    return null;
  }

  // messagingが初期化されていない場合は初期化
  if (!messaging) {
    console.log('Initializing messaging...');
    messaging = getMessaging(firebaseApp);
  }

  try {
    console.log('Requesting notification permission...');
    // 通知許可をリクエスト
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    
    if (permission !== 'granted') {
      throw new Error('通知許可が拒否されました');
    }

    console.log('Notification permission granted.');

    // Service Workerを登録
    let registration;
    try {
      console.log('Registering Service Worker...');
      
      // Android Chrome の場合はデフォルトスコープを使用
      const swOptions = isAndroidChrome() 
        ? { scope: '/' }  // Android Chrome では広いスコープを使用
        : { scope: '/firebase-cloud-messaging-push-scope' };
      
      console.log('Service Worker options:', swOptions);
      
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', swOptions);
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Service Workerが有効になるまで待つ
      console.log('Waiting for Service Worker to be ready...');
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');
      
    } catch (swError) {
      console.error('Service Worker registration failed:', swError);
      throw new Error(`Service Workerの登録に失敗しました: ${swError instanceof Error ? swError.message : String(swError)}`);
    }

    // FCMトークンを取得
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    console.log('VAPID Key exists:', !!vapidKey);
    console.log('VAPID Key length:', vapidKey ? vapidKey.length : 0);
    
    if (!vapidKey) {
      throw new Error('VAPID キーが設定されていません');
    }

    console.log('Getting FCM token...');
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });
    
    console.log('FCM token received:', !!token);
    console.log('FCM token length:', token ? token.length : 0);
    
    if (token) {
      // フォアグラウンドメッセージハンドラーを設定
      setupForegroundMessageHandler();
      console.log('=== confirmNotification completed successfully ===');
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

// フォアグラウンドでのメッセージ受信処理
function setupForegroundMessageHandler() {
  if (!messaging) return;
  
  // 長めのバイブレーションパターンを生成
  const getLongVibrationPattern = () => {
    // より長く、気づきやすいバイブレーションパターン
    return [
      500, 200,  // 0.5秒振動、0.2秒停止
      500, 200,  // 0.5秒振動、0.2秒停止  
      500, 200,  // 0.5秒振動、0.2秒停止
      300, 100,  // 0.3秒振動、0.1秒停止
      300, 100,  // 0.3秒振動、0.1秒停止
      700        // 最後に0.7秒の長い振動
    ];
  };
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // ページがアクティブな時は手動で通知を表示
    if (payload.notification) {
      const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon.png',
        data: payload.data,
        tag: 'go-home-timer',
        requireInteraction: true,
        silent: false,  // 通知音を鳴らす
        renotify: true, // 同じtagでも再通知する
        vibrate: getLongVibrationPattern(), // 長いバイブレーション
        badge: '/badge.png'
      } as NotificationOptions;

      console.log('Foreground notification options:', notificationOptions);

      const notification = new Notification(
        payload.notification.title || 'お知らせ', 
        notificationOptions
      );

      // 通知クリック時の処理
      notification.onclick = () => {
        notification.close();
        window.focus();
        // 追加のバイブレーション（クリック時）
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      };
      
      // 通知表示時に追加のバイブレーション（ブラウザAPIを直接使用）
      if ('vibrate' in navigator) {
        navigator.vibrate(getLongVibrationPattern());
      }
    }
  });
}

export { firebaseApp, messaging }; 