importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

console.log('=== Firebase Messaging Service Worker loaded ===');

// Firebase設定を動的に取得
let firebaseConfig = null;
let messaging = null;

// User Agent判定
function isAndroidChrome() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const isAndroid = userAgent.includes('Android');
  const isChrome = userAgent.includes('Chrome');
  console.log('Service Worker - User Agent:', userAgent);
  console.log('Service Worker - Is Android Chrome:', isAndroid && isChrome);
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
    console.log('Service Worker - Initializing Firebase...');
    
    // 設定をAPIから取得
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status} ${response.statusText}`);
    }
    
    firebaseConfig = await response.json();
    console.log('Service Worker - Firebase config loaded:', !!firebaseConfig);
    
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    console.log('Service Worker - Firebase initialized successfully');
    
    // バックグラウンドメッセージの処理を設定
    messaging.onBackgroundMessage((payload) => {
      console.log('Service Worker - Received background message:', payload);

      const notificationTitle = payload.notification?.title || 'おうちタイマー';
      const notificationOptions = createNotificationOptions(payload);

      console.log('Service Worker - Showing notification with options:', notificationOptions);
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
console.log('Service Worker - Starting Firebase initialization...');
initializeFirebase();

// 標準的なPUSHイベントリスナー（FCMとは独立して動作）
self.addEventListener('push', function(event) {
  console.log('Service Worker - Push event received:', event);
  console.log('Service Worker - Push event data exists:', !!event.data);
  
  if (!event.data) {
    console.log('Service Worker - Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Service Worker - Push payload:', payload);
    
    const notificationTitle = payload.notification?.title || payload.title || 'おうちタイマー';
    const notificationOptions = createNotificationOptions(payload);

    console.log('Service Worker - Push event: showing notification with options:', notificationOptions);
    
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
    
    console.log('Service Worker - Showing default notification due to parse error');
    
    event.waitUntil(
      self.registration.showNotification('おうちタイマー', defaultOptions)
    );
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  console.log('Action:', event.action);
  
  event.notification.close();
  
  // アクション別の処理
  if (event.action === 'open') {
    console.log('Open action clicked');
  } else {
    console.log('Default notification click');
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
          console.log('Focusing existing tab');
          return client.focus();
        }
      }
      // 新しいタブで開く
      if (clients.openWindow) {
        console.log('Opening new tab');
        return clients.openWindow('/');
      }
    }).catch(function(error) {
      console.error('Error handling notification click:', error);
    })
  );
});

// 通知が閉じられた時の処理（オプション）
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.tag);
  console.log('Close reason:', event.reason || 'user');
});

// Service Workerのインストール処理
self.addEventListener('install', function() {
  console.log('Firebase messaging service worker installing...');
  self.skipWaiting();
});

// Service Workerのアクティベート処理
self.addEventListener('activate', function(event) {
  console.log('Firebase messaging service worker activating...');
  event.waitUntil(self.clients.claim());
}); 