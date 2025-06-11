importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

// Firebase設定を動的に取得
let firebaseConfig = null;
let messaging = null;

// 設定を取得してFirebaseを初期化
async function initializeFirebase() {
  try {
    // 設定をAPIから取得
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config');
    }
    firebaseConfig = await response.json();
    
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    // バックグラウンドメッセージの処理を設定
    messaging.onBackgroundMessage((payload) => {
      console.log('Received background message: ', payload);

      const notificationTitle = payload.notification?.title || 'おうちタイマー';
      const notificationOptions = {
        body: payload.notification?.body || 'お知らせがあります',
        icon: payload.notification?.icon || '/icon.png',
        badge: '/badge.png',
        data: payload.data || {},
        tag: 'go-home-timer-notification',
        requireInteraction: true,
        silent: false,
        renotify: true
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

// Service Workerの初期化時にFirebaseを設定
initializeFirebase();

// 標準的なPUSHイベントリスナー（FCMとは独立して動作）
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const payload = event.data.json();
    console.log('Push payload:', payload);
    
    const notificationTitle = payload.notification?.title || payload.title || 'おうちタイマー';
    const notificationOptions = {
      body: payload.notification?.body || payload.body || 'お知らせがあります',
      icon: payload.notification?.icon || payload.icon || '/icon.png',
      badge: '/badge.png',
      data: payload.data || payload,
      tag: 'go-home-timer-notification',
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  } catch (error) {
    console.error('Error parsing push data:', error);
    
    // パースエラーの場合はデフォルト通知を表示
    const defaultOptions = {
      body: 'お知らせがあります',
      icon: '/icon.png',
      badge: '/badge.png',
      tag: 'go-home-timer-notification',
      requireInteraction: true
    };
    
    event.waitUntil(
      self.registration.showNotification('おうちタイマー', defaultOptions)
    );
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
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
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.tag);
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