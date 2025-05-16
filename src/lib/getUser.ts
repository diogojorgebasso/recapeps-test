"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase/clientApp";

export function useUserWithClaims() {
    const [user, setUser] = useState<User | null>();
    const [pro, setIsPro] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            setUser(authUser);
            if (authUser) {
                const idTokenResult = await authUser.getIdTokenResult();
                setIsPro(!!idTokenResult.claims.pro);
            }
        });
        return unsubscribe;
    }, []);

    return { user, pro };
}