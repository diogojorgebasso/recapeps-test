// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";

import { getAuth, IdTokenResult } from "firebase/auth";

export async function getAuthenticatedAppForUser() {
    const authIdToken = (await cookies()).get("__session")?.value;

    // TODO : remove this bcs of the new initilizeApp.
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
        initializeApp(firebaseConfig),
        {
            authIdToken,
        }
    );

    const auth = getAuth(firebaseServerApp);
    await auth.authStateReady();

    let isPro = false;

    if (auth.currentUser) {
        // true  ➟ subscriber,  false ➟ free user
        const { claims }: IdTokenResult = await auth.currentUser.getIdTokenResult();
        isPro = !!claims.pro;
    }

    return { firebaseServerApp, currentUser: auth.currentUser, isPro };
}