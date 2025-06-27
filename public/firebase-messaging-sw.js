importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

// Firebase設定を動的に取得
let firebaseConfig = null;
let messaging = null;

// User Agent判定
function isAndroidChrome() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const isAndroid = userAgent.includes('Android');
  const isChrome = userAgent.includes('Chrome');
  return isAndroid && isChrome;
}

// 通知オプションを生成する関数
function createNotificationOptions(payload) {
  const body = payload.notification?.body || payload.body || 'お知らせがあります';
  
  return {
    body: body,
    icon: payload.notification?.icon || payload.icon || '/icon.png',
    badge: '/badge.png',
    data: payload.data || payload,
    tag: 'go-home-timer-notification',
    requireInteraction: true,
    silent: false,  // 通知音を鳴らす
    renotify: true, // 同じtagでも再通知する
    // Android固有の設定
    ...(isAndroidChrome() && {
      actions: [
        {
          action: 'open',
          title: 'アプリを開く',
          icon: '/icon.png'
        }
      ],
      // 通知の重要度を高く設定
      priority: 'high',
      visibility: 'public'
    })
  };
}

// 設定を取得してFirebaseを初期化
async function initializeFirebase() {
  try {
    // 設定をAPIから取得
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status} ${response.statusText}`);
    }
    
    firebaseConfig = await response.json();
    
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    // バックグラウンドメッセージの処理を設定
    messaging.onBackgroundMessage((payload) => {

      const notificationTitle = payload.notification?.title || 'おうちタイマー';
      const notificationOptions = createNotificationOptions(payload);

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
  } catch (error) {
    console.error('Service Worker - Failed to initialize Firebase:', error);
    console.error('Service Worker - Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// Service Workerの初期化時にFirebaseを設定
initializeFirebase();

// 標準的なPUSHイベントリスナー（FCMとは独立して動作）
self.addEventListener('push', function(event) {
  
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    
    const notificationTitle = payload.notification?.title || payload.title || 'おうちタイマー';
    const notificationOptions = createNotificationOptions(payload);
    
    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('Service Worker - Error parsing push data:', error);
    
    // パースエラーの場合はデフォルト通知を表示
    const defaultOptions = {
      body: 'お知らせがあります',
      icon: '/icon.png',
      badge: '/badge.png',
      tag: 'go-home-timer-notification',
      requireInteraction: true,
      silent: false  // 通知音を鳴らす
    };
    
    event.waitUntil(
      self.registration.showNotification('おうちタイマー', defaultOptions)
    );
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  
  event.notification.close();
  
  // アクション別の処理
  if (event.action === 'open') {
  } else {
  }
  
  // アプリを開くまたはフォーカス
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // 既に開いているタブがあるかチェック
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // 新しいタブで開く
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    }).catch(function(error) {
      console.error('Error handling notification click:', error);
    })
  );
});

// 通知が閉じられた時の処理（オプション）
self.addEventListener('notificationclose', function() {
});

// Service Workerのインストール処理
self.addEventListener('install', function() {
  self.skipWaiting();
});

// Service Workerのアクティベート処理
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
}); 