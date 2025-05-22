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

  const notificationTitle = payload.notification.title;
  const notificationOptions = { body: payload.notification.body };

  self.registration.showNotification(notificationTitle, notificationOptions);
});