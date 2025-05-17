// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCQL9kH3r-y4Q4PtzQ_t9lBJl5J3zuty7k",
    authDomain: "recapeps-test.firebaseapp.com",
    projectId: "recapeps-test",
    storageBucket: "recapeps-test.firebasestorage.app",
    messagingSenderId: "298375526115",
    appId: "1:298375526115:web:784cb51da316177ad637d6",
    measurementId: "G-9PK8PPVBSE"
};

export async function getAuthenticatedAppForUser() {
    const authIdToken = (await cookies()).get("__session")?.value;

    let pro = false;
    let validToken = false;

    if (authIdToken) {
        try {
            // Simple JWT decoding (tokens have 3 parts separated by dots)
            const parts = authIdToken.split('.');
            if (parts.length === 3) {
                const payload = parts[1];
                const decoded = Buffer.from(payload, 'base64').toString();
                const claims = JSON.parse(decoded);

                // Check token expiration
                const now = Math.floor(Date.now() / 1000);
                if (claims.exp && claims.exp > now) {
                    validToken = true;
                    pro = claims.pro === true;
                } else {
                    console.warn("authIdToken is expired");
                }
            }
        } catch (error) {
            console.error("Error decoding JWT token:", error);
        }
    }

    let firebaseServerApp = null;
    let user = null;

    if (validToken) {
        firebaseServerApp = initializeServerApp(
            initializeApp(firebaseConfig),
            {
                authIdToken
            }
        );

        const auth = getAuth(firebaseServerApp);
        await auth.authStateReady();

        user = auth.currentUser;
    }

    return { firebaseServerApp, user, pro };
}