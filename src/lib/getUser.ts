"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase/clientApp";

export function useUserWithClaims() {
    const [user, setUser] = useState<User | null>();
    const [pro, setIsPro] = useState<boolean>(false);

    useEffect(() => {
        // onAuthStateChanged listens for changes in the user's authentication state.
        // The callback function is executed when the listener is first attached,
        // and any time the authentication state changes (login/logout).
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            setUser(authUser); // Update the user state with the current auth user or null.

            // This entire block needs to be inside onAuthStateChanged because:
            // 1. It operates on `authUser`, which is only definitively known here.
            // 2. It needs to re-evaluate if `authUser` changes (e.g., user logs in).
            if (authUser) {
                let forceRefresh = false;

                // Check for URL parameters to force a token refresh.
                // This is done here because we need to refresh the token for the *current* authUser.
                if (typeof window !== 'undefined') {
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('refresh_claims') === 'true') {
                        forceRefresh = true;
                        // Clean up the URL to prevent re-refreshing on navigation or re-renders.
                        params.delete('refresh_claims');
                        const newSearch = params.toString();
                        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
                        window.history.replaceState({}, document.title, newUrl);
                    }
                }

                // Get the ID token result. If forceRefresh is true, it bypasses the cache.
                // This is essential for fetching the latest custom claims.
                const idTokenResult = await authUser.getIdTokenResult(forceRefresh);
                setIsPro(!!idTokenResult.claims.pro); // Update 'pro' status based on claims.
            } else {
                // If there's no authenticated user, they are not 'pro'.
                setIsPro(false);
            }
        });

        // Cleanup: Unsubscribe from the listener when the component unmounts.
        return unsubscribe;
    }, []); // Empty dependency array: sets up the listener once on mount.

    return { user, pro };
}