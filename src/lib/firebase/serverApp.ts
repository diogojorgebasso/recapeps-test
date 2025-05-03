// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";

import { getAuth, IdTokenResult } from "firebase/auth";

export async function getAuthenticatedAppForUser() {
    const authIdToken = (await cookies()).get("__session")?.value;

    const firebaseServerApp = initializeServerApp(
        initializeApp(),
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