'use client';

import { useState, useEffect } from 'react';
import { AuthContext } from './useAuth';
import { setCookie, deleteCookie } from "cookies-next";
import { onIdTokenChanged } from '@/lib/firebase/auth';
import { User as FirebaseAuthUser } from 'firebase/auth';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children, initialUser }: { children: ReactNode, initialUser: any }) {
    const [user, setUser] = useState(initialUser);
    const [pro, setPro] = useState<boolean>(false);
    const [loading, setLoading] = useState(!initialUser); // If we have initialUser, we're not loading
    const router = useRouter();

    useEffect(() => {
        return onIdTokenChanged(async (user) => {
            if (user) {
                const idToken = await user.getIdToken(true);
                await setCookie("__session", idToken);
            } else {
                await deleteCookie("__session");
            }
            if (initialUser?.uid !== user?.uid) router.refresh();

        });
    }, [initialUser, router]);

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


