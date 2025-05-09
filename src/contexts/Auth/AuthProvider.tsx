'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { AuthContext } from './useAuth';
import { auth } from "@/lib/firebase/clientApp";
import { updateProfile, User as FirebaseUser, getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { setCookie, deleteCookie } from "cookies-next";
import { onIdTokenChanged } from '@/lib/firebase/auth';

export function AuthProvider({ children, initialUser }: { children: React.ReactNode, initialUser: FirebaseUser }) {
    const [user, setUser] = useState<FirebaseUser | null>(initialUser);
    const [pro, setPro] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState(!initialUser); // If we have initialUser, we're not loading

    useEffect(() => {

        const authStateUnsubscribe = onAuthStateChanged(auth, (authUser) => {
            setLoading(false);
            setUser(authUser);
            if (!authUser && user) {
                setUser(null);
                setPro(false);
            }
        });

        const tokenUnsubscribe = onIdTokenChanged(async (tokenUser: FirebaseUser | null) => {
            if (tokenUser) {
                const tokenResult = await getIdTokenResult(tokenUser, true);
                setPro(!!tokenResult.claims.pro);
                const idToken = await tokenUser.getIdToken();
                await setCookie("__session", idToken);
            } else {
                await deleteCookie("__session");
            }

            if (initialUser?.uid === user?.uid) {
                return
            }
            window.location.reload();
        });

        // Clean up both listeners
        return () => {
            authStateUnsubscribe();
            tokenUnsubscribe();
        };
    }, [initialUser, user]);

    const updatePhotoURLInContext = async (photoURL: string) => {
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL });
                setUser(currentUser => currentUser ? { ...currentUser, photoURL } as FirebaseUser : null);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error updating photo URL in context:", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                pro: pro ?? false,
                updatePhotoURLInContext,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


