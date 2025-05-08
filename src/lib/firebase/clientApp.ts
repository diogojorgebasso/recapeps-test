'use client';

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseApp = initializeApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, "europe-west1");

export const messaging = async () => {
    if (typeof window === 'undefined') return null;          // SSR guard
    if (!(await isSupported())) return null;                 // Browser capability guard
    return getMessaging(firebaseApp);
};

