// Service workers don't use ES module imports, use importScripts instead
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCQL9kH3r-y4Q4PtzQ_t9lBJl5J3zuty7k",
    authDomain: "recapeps-test.firebaseapp.com",
    projectId: "recapeps-test",
    storageBucket: "recapeps-test.firebasestorage.app",
    messagingSenderId: "298375526115",
    appId: "1:298375526115:web:784cb51da316177ad637d6",
    measurementId: "G-9PK8PPVBSE"
};

// Initialize Firebase with compat version
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log("Firebase messaging service worker initializing...");

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);

    // Customize notification here
    const notificationTitle = payload.notification?.title || "Nouveau message";
    const notificationOptions = {
        body: payload.notification?.body || "Vous avez un nouveau message",
        icon: payload.notification?.icon || "/favicon.ico",
        // You can add more options like 'data', 'actions', etc.
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
    event.notification.close();
    clients.openWindow('/notifications'); //TODO : dynamic path like /item/${itemId}
});