"use client";
import {
    createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { onIdTokenChanged } from "@/lib/firebase/auth";
import { setCookie, deleteCookie } from "cookies-next";
import type { User } from "firebase/auth";

interface AuthCtx {
    user: User | null;
    isPro: boolean;
}

const Ctx = createContext<AuthCtx>({
    user: null,
    isPro: false,
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

    return (
        <Ctx.Provider value={{ user, isPro }}>{children}</Ctx.Provider>
    );
}
