"use client";
import {
    createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { onIdTokenChanged } from "@/lib/firebase/auth";
import { setCookie, deleteCookie } from "cookies-next";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/types/User";
import { userRepo } from "@/lib/firebase/userRepository";

interface AuthCtx {
    user: User | null;
    isPro: boolean;
    profile: UserProfile | null;
}

const Ctx = createContext<AuthCtx>({
    user: null,
    isPro: false,
    profile: null,
});
export const useAuth = () => useContext(Ctx);

export function AuthProvider({
    initialUser,
    initialIsPro,
    children,
}: {
    initialUser: User | null;
    initialIsPro: boolean;
    children: ReactNode;
}) {
    const [user, setUser] = useState(initialUser);
    const [isPro, setIsPro] = useState(initialIsPro);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    /* 1️⃣  Auth / claim listener */
    useEffect(() => {
        return onIdTokenChanged(async (u) => {
            if (u) {
                await setCookie("__session", await u.getIdToken());
                const { claims } = await u.getIdTokenResult();
                setIsPro(!!claims.pro);
            } else {
                await deleteCookie("__session");
                setIsPro(false);
            }
            setUser(u);
        });
    }, []);

    /* 2️⃣  Profile listener via repository */
    useEffect(() => {
        if (!user) { setProfile(null); return; }
        // repository hides the Firestore details
        const unsub = userRepo.listenProfile(user.uid, setProfile);
        return unsub;
    }, [user?.uid]);

    return (
        <Ctx.Provider value={{ user, isPro, profile }}>{children}</Ctx.Provider>
    );
}
