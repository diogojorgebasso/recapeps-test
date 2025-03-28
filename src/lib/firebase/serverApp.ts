// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { headers } from "next/headers";
import { initializeServerApp } from "firebase/app";

import { getAuth } from "firebase/auth";

export async function getAuthenticatedAppForUser() {
    const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];

    const firebaseConfig = {
        apiKey: "AIzaSyCQL9kH3r-y4Q4PtzQ_t9lBJl5J3zuty7k",
        authDomain: "recapeps-test.firebaseapp.com",
        projectId: "recapeps-test",
        storageBucket: "recapeps-test.firebasestorage.app",
        messagingSenderId: "298375526115",
        appId: "1:298375526115:web:784cb51da316177ad637d6",
        measurementId: "G-9PK8PPVBSE"
      };
      
    const firebaseServerApp = initializeServerApp(
        firebaseConfig,
        idToken
            ? {
                authIdToken: idToken,
            }
            : {}
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    return { firebaseServerApp, currentUser: auth.currentUser };
}