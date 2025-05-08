// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp, FirebaseServerApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

type FirebaseBundle = {
    app: FirebaseServerApp;
    auth: Auth;
    db: Firestore;
};

let cached: FirebaseBundle | null = null;


function initFirebase(authIdToken?: string): FirebaseBundle {
    if (cached) return cached;

    // Firebase Server App is a new feature in the JS SDK that allows you to
    // instantiate the SDK with credentials retrieved from the client & has
    // other affordances for use in server environments.
    const app = initializeServerApp(
        // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
        initializeApp(),
        {
            authIdToken,
        }
    );

    // 2) derive helpers
    const auth = getAuth(app);
    const db = getFirestore(app);

    cached = { app, auth, db };
    return cached;
}

export const db = initFirebase().db;
export const auth = initFirebase().auth;

// Returns an authenticated client SDK instance for use in Server Side Rendering
// and Static Site Generation
export async function getAuthenticatedAppForUser() {
    const authIdToken = (await cookies()).get("__session")?.value;
    const { auth } = initFirebase(authIdToken);

    await auth.authStateReady();
    const user = auth.currentUser;
    let isPro = false;

    if (authIdToken)
        try {
            // Simple JWT decoding (tokens have 3 parts separated by dots)
            const parts = authIdToken.split('.');
            if (parts.length === 3) {
                const payload = parts[1];
                const decoded = Buffer.from(payload, 'base64').toString();
                const claims = JSON.parse(decoded);
                isPro = claims.pro === true;
            }
        } catch (error) {
            console.error("Error decoding JWT token:", error);
        }

    return { user, isPro };
}