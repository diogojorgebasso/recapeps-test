'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    signInWithGoogle,
    signOut,
    onAuthStateChanged
} from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";

function useUserSession(initialUser) {
    // The initialUser comes from the server via a server component
    const [user, setUser] = useState(initialUser);
    const router = useRouter();

    // Register the service worker that sends auth state back to server
    // The service worker is built with npm run build-service-worker
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register('/auth-service-worker.js', { type: 'module' })
                .then((registration) => console.log("scope is: ", registration.scope))
                .catch((error) => console.log("SW registration failed: ", error));
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged((authUser) => {
            setUser(authUser)
        })

        return () => unsubscribe()
    }, []);

    useEffect(() => {
        onAuthStateChanged((authUser) => {
            if (user === undefined) return

            // refresh when user changed to ease testing
            if (user?.email !== authUser?.email) {
                router.refresh()
            }
        })
    }, [user])

    return user;
}

interface User {
    displayName?: string;
    email?: string;
    photoURL?: string;
}

export default function Header({ initialUser }: { initialUser?: User }) {

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
            <Link href="/" className="logo">
                <img src="/friendly-eats.svg" alt="FriendlyEats" />
                Friendly Eats
            </Link>
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
                    <img src="/profile.svg" alt="A placeholder user image" />
                    Sign In with Google
                </a></div>
            )}
        </header>
    );
}