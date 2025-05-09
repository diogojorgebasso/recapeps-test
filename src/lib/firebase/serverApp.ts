// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

import { cookies } from "next/headers";
import { initializeServerApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export async function getAuthenticatedAppForUser() {
    const authIdToken = (await cookies()).get("__session")?.value;
    console.log("AuthIdToken", authIdToken);
    return { currentUser: null };

}