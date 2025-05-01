import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
    apiKey: "AIzaSyCQL9kH3r-y4Q4PtzQ_t9lBJl5J3zuty7k",
    authDomain: "recapeps-test.firebaseapp.com",
    projectId: "recapeps-test",
    storageBucket: "recapeps-test.firebasestorage.app",
    messagingSenderId: "298375526115",
    appId: "1:298375526115:web:784cb51da316177ad637d6",
    measurementId: "G-9PK8PPVBSE"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

console.log("Firebase messaging service worker initializing...");

onBackgroundMessage(messaging, (payload) => {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);

    // Customize notification here
    const notificationTitle = payload.notification?.title ?? "Nouveau message";
    const notificationOptions = {
        body: payload.notification?.body ?? "Vous avez un nouveau message",
        icon: payload.notification?.icon ?? "/favicon.ico",
        // TODO : You can add more options like 'data', 'actions', etc.
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
    event.notification.close();
    clients.openWindow('/notifications'); //TODO : dynamic path like /item/${itemId}
});