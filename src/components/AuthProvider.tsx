"use client";
import {
    createContext, useContext, useEffect, useState, ReactNode,
} from "react";
import { onIdTokenChanged } from "@/lib/firebase/auth";
import { setCookie, deleteCookie } from "cookies-next";
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

    /* 2️⃣ FCM Initialization & Token Saving */
    useEffect(() => {
        if (user && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            Notification.requestPermission().
                then((permission) => {
                    if (permission === "granted") {
                        console.log("Notification permission granted.");

                        getToken(messaging, {
                            vapidKey: "BGzXJl9faEyUIC_26KtChhf5EucMFanHqEFxP8m3YYYIAf_9vq-FvJfAPTv0X_WRFmbnwyGlZ7Ra4dwCMD0M9PA	",
                        }).then(async (currentToken) => {
                            if (currentToken) {
                                console.log("FCM Token:", currentToken);
                                try {
                                    const saveTokenFunction = httpsCallable(functions, 'savefcmtoken');
                                    await saveTokenFunction({ token: currentToken });
                                    console.log("FCM token sent to server successfully.");
                                } catch (error) {
                                    console.error("Error sending FCM token to server:", error);
                                }

                                // Handle foreground messages
                                onMessage(messaging, (payload) => {
                                    console.log("Message received in foreground. ", payload);

                                    // Show a notification
                                    const notificationTitle = payload.notification?.title ?? "Nouveau Message";
                                    const notificationOptions = {
                                        body: payload.notification?.body ?? "",
                                        icon: payload.notification?.icon ?? "/favicon.ico",
                                    };

                                    new Notification(notificationTitle, notificationOptions);
                                });

                            } else {
                                console.log(
                                    "No registration token available. Request permission to generate one."
                                );
                            }
                        }).catch((err) => {
                            console.error("An error occurred while retrieving token. ", err);
                        });
                    } else {
                        console.log("Unable to get permission to notify.");
                    }
                })
                .catch((error) => { // Catch for requestPermission
                    console.error("An error occurred while requesting permission. ", error);
                });
        }
    }, [user]);

    return (
        <Ctx.Provider value={{ user, isPro }}>{children}</Ctx.Provider>
    );
}
