'use client';

const firebaseConfig = {
  apiKey: "AIzaSyCQL9kH3r-y4Q4PtzQ_t9lBJl5J3zuty7k",
  authDomain: "recapeps-test.firebaseapp.com",
  projectId: "recapeps-test",
  storageBucket: "recapeps-test.firebasestorage.app",
  messagingSenderId: "298375526115",
  appId: "1:298375526115:web:784cb51da316177ad637d6",
  measurementId: "G-9PK8PPVBSE"
};

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);