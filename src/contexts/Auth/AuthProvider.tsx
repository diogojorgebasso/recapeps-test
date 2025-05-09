'use client';

import { useState, useEffect } from 'react';
import { AuthContext } from './useAuth';
import { User as FirebaseUser } from 'firebase/auth';
import { setCookie, deleteCookie } from "cookies-next";
import { onIdTokenChanged } from '@/lib/firebase/auth';
import { ReactNode } from 'react';

function useUserSession(initialUser: any) {
    useEffect(() => {
        console.log("ENTREI NO USE EFFECT", initialUser);
        return onIdTokenChanged(async (user) => {
            if (user) {
                const idToken = await user.getIdToken(true);
                await setCookie("__session", idToken);
            } else {
                await deleteCookie("__session");
            }
            if (initialUser?.uid === user?.uid) {
                return;
            }
            window.location.reload();
        });
    }, [initialUser]);

    return initialUser;
}

export function AuthProvider({ children, initialUser }: { children: ReactNode, initialUser: object | undefined }) {
    const user = useUserSession(initialUser)
    const [pro, setPro] = useState<boolean>(false);
    const [loading, setLoading] = useState(!initialUser); // If we have initialUser, we're not loading
    console.log("User NO AuthProvider 1 ", user);
    return (
        <AuthContext.Provider
            value={{
                user,
                pro: pro ?? false,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


