'use client';

import * as React from 'react';
import { AuthContext, User } from './AuthContext';
import { useEffect } from 'react';
import { getToken, onMessage } from "firebase/messaging";
import { messaging, functions } from "@/lib/firebase/clientApp"; // Import functions
import { httpsCallable } from "firebase/functions";


export interface AuthProviderProps {
    user: User | null;
    children: React.ReactNode;
}

export const AuthProvider: React.FunctionComponent<AuthProviderProps> = ({
    user,
    children
}) => {
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
        <AuthContext.Provider
            value={{
                user
            }
            }
        >
            {children}
        </AuthContext.Provider>
    );
};