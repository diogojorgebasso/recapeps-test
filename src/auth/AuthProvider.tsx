'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { auth } from "@/lib/firebase/clientApp";
import { updateProfile, User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import { setCookie, deleteCookie } from "cookies-next";
import { onIdTokenChanged } from '@/lib/firebase/auth';

export function AuthProvider({ children, initialUser }: { children: React.ReactNode, initialUser: FirebaseUser }) {
    const [user, setUser] = useState<FirebaseUser | null>(initialUser);
    const [pro, setPro] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        return onIdTokenChanged(async (user: FirebaseUser | null) => {
            if (user) {
                const tokenResult = await getIdTokenResult(user, true);
                setPro(!!tokenResult.claims.pro);

                const idToken = await user.getIdToken();
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
                updatePhotoURLInContext
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


