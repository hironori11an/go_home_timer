importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCsHKEquFb9pCb4XChZG6bQ6EnGNArzzsI",
    authDomain: "go-home-timer.firebaseapp.com",
    projectId: "go-home-timer",
    storageBucket: "go-home-timer.firebasestorage.app",
    messagingSenderId: "984901580554",
    appId: "1:984901580554:web:ffb1826329963539866cf3",
    measurementId: "G-LH2J4NJG2Q"
  };

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'お知らせ';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon.png',
    badge: payload.notification?.badge || '/badge.png',
    data: payload.data || {},
    tag: 'go-home-timer-notification',
    requireInteraction: true,
    // アクションボタンがある場合は追加
    actions: payload.webpush?.notification?.actions || []
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // アクションボタンがクリックされた場合
  if (event.action) {
    console.log('Action clicked:', event.action);
    // 特定のアクションに応じた処理
    if (event.action === 'go-home') {
      // 帰宅アクションの処理
      event.waitUntil(
        clients.openWindow('/')
      );
    } else if (event.action === 'snooze') {
      // スヌーズアクションの処理 - 何もしない（通知を閉じるだけ）
      return;
    }
  } else {
    // 通知本体がクリックされた場合、アプリを開く
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});