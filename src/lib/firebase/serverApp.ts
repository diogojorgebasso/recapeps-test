// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export async function getAuthenticatedAppForUser() {
    const authIdToken = (await cookies()).get("__session")?.value;
    console.log("AuthIdToken", authIdToken);
    if (!authIdToken) return { currentUser: null };

    // Firebase Server App is a new feature in the JS SDK that allows you to
    // instantiate the SDK with credentials retrieved from the client & has
    // other affordances for use in server environments.
    const firebaseServerApp = initializeServerApp(
        // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
        initializeApp(),
        {
            appCheckToken: process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY
        }
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    const user = auth.currentUser;
    let isPro = false;

    try {
        console.log("Im entering here.")
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

    return { firebaseServerApp, user, isPro };
}