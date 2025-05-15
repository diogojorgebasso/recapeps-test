'use client';

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";
import {
    initializeAppCheck,
    ReCaptchaEnterpriseProvider,
    CustomProvider,
} from 'firebase/app-check'

const firebaseConfig = {
    apiKey: "AIzaSyCXb49PmpcCpPCyXaUxCMJnpJpTs0t0nLI",
    authDomain: "recapeps-platform.firebaseapp.com",
    projectId: "recapeps-platform",
    storageBucket: "recapeps-platform.firebasestorage.app",
    messagingSenderId: "148248325935",
    appId: "1:148248325935:web:27093543499cf6a55b3bda",
    measurementId: "G-RK00EBVHZN"
};

export const firebaseApp = initializeApp(firebaseConfig);
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
        initializeAppCheck(firebaseApp, {
            provider: new ReCaptchaEnterpriseProvider('6Lco8f4qAAAAAPFNsctWY6ASBbDBnWZ50v5jF9eP'),
            isTokenAutoRefreshEnabled: true
        });

        console.log("Firebase App Check initialized.");
    } catch (error) {
        console.error("Error initializing Firebase App Check:", error);
    }
}
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, "europe-west1");

export const messaging = async () => {
    if (typeof window === 'undefined') return null;          // SSR guard
    if (!(await isSupported())) return null;                 // Browser capability guard
    return getMessaging(firebaseApp);
};

