"use client";
import {
    createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { onIdTokenChanged } from "@/lib/firebase/auth"; // Correct import for signIn and sendPasswordResetEmail
import type { User } from "firebase/auth";
import { getToken, onMessage } from "firebase/messaging";
import { messaging, functions } from "@/lib/firebase/clientApp"; // Import functions
import { httpsCallable } from "firebase/functions";

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
        const unsubscribe = onIdTokenChanged(async (u) => {
            setUser(u);
            if (u) {
                const idTokenResult = await u.getIdTokenResult();
                setIsPro(!!idTokenResult.claims.pro);
            } else {
                setIsPro(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let unsubscribeMessaging: (() => void) | undefined;
        if (typeof window !== 'undefined' && user) {
            if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        console.log("Notification permission granted.");

                        getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
                            .then(async (currentToken) => {
                                if (currentToken) {
                                    console.log("FCM Token:", currentToken);
                                    try {
                                        const saveToken = httpsCallable(functions, 'saveFCMToken');
                                        await saveToken({ token: currentToken });
                                        console.log("FCM token saved successfully.");
                                    } catch (error) {
                                        console.error("Error saving FCM token:", error);
                                    }
                                } else {
                                    console.log("No registration token available. Request permission to generate one.");
                                }
                            })
                            .catch((err) => {
                                console.error("An error occurred while retrieving token. ", err);
                            });

                        unsubscribeMessaging = onMessage(messaging, (payload) => {
                            console.log("Message received in foreground. ", payload);
                            const notificationTitle = payload.notification?.title ?? "Nouveau Message";
                            const notificationOptions = {
                                body: payload.notification?.body ?? "",
                                icon: payload.notification?.icon ?? "/favicon.ico",
                            };
                            new Notification(notificationTitle, notificationOptions);
                        });

                    } else {
                        console.log("Unable to get permission to notify.");
                    }
                }).catch((error) => {
                    console.error("An error occurred while requesting permission. ", error);
                });
            } else {
                console.log("Push messaging is not supported.");
            }
        }

        return () => {
            if (unsubscribeMessaging) {
                unsubscribeMessaging();
            }
        };
    }, [user]);

    return (
        <Ctx.Provider value={{ user, isPro }}>{children}</Ctx.Provider>
    );
}
