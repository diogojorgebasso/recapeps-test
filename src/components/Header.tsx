'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    signInWithGoogle,
    signOut,
    onIdTokenChanged
} from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { useBreakpointValue } from "@chakra-ui/react";
import { setCookie, deleteCookie } from "cookies-next";

function useUserSession(initialUser) {
    useEffect(() => {
        return onIdTokenChanged(async (user) => {
            if (user) {
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

    return initialUser;
}
interface User {
    displayName?: string;
    email?: string;
    photoURL?: string;
}

export default function Header({ initialUser }: { initialUser?: User }) {
    const isMobile = useBreakpointValue({ base: true, md: false }, { fallback: "base" });
    const user = useUserSession(initialUser);

    const handleSignOut: React.MouseEventHandler<HTMLAnchorElement> = event => {
        event.preventDefault();
        signOut();
    };

    const handleSignIn: React.MouseEventHandler<HTMLAnchorElement> = event => {
        event.preventDefault();
        signInWithGoogle();
    };

    return (
        <header>
            {user ? (
                <>
                    <div className="profile">
                        <p>
                            <img className="profileImage" src={user.photoURL || "/avatar.svg"} alt={user.email} />
                            {user.displayName}
                        </p>

                        <div className="menu">
                            ...
                            <ul>
                                <li>{user.displayName}</li>

                                <li>
                                    <a href="#" onClick={handleSignOut}>
                                        Sign Out
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </>
            ) : (
                <div className="profile"><a href="#" onClick={handleSignIn}>
                    Sign In with Google
                </a></div>
            )}
        </header>
    );
}