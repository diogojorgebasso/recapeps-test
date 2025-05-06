'use client';

import * as React from 'react';
import { useState } from 'react';
import { AuthContext, User } from './AuthContext';
import { useEffect } from 'react';
import { functions } from "@/lib/firebase/clientApp"; // Import without messaging
import { httpsCallable } from "firebase/functions";
import { updateProfile, getAuth } from 'firebase/auth';

// Don't import messaging at the top level
// We'll conditionally import it later

export interface AuthProviderProps {
    user: User | null;
    children: React.ReactNode;
}

export const AuthProvider: React.FunctionComponent<AuthProviderProps> = ({
    user: initialUser,
    children
}) => {
    // Add state to manage user so we can update it
    const [user, setUser] = useState<User | null>(initialUser);

    // Update local state when prop changes
    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    useEffect(() => {
        let unsubscribeMessaging: (() => void) | undefined;

        // Only run this code in the browser, not during SSR
        const setupMessaging = async () => {
            if (typeof window !== 'undefined' && user) {
                // Check for all required browser features
                if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
                    try {
                        // Dynamically import messaging modules only when needed
                        const { getToken, onMessage } = await import("firebase/messaging");
                        const { messaging } = await import("@/lib/firebase/clientApp");

                        const permission = await Notification.requestPermission();
                        if (permission === "granted") {
                            console.log("Notification permission granted.");

                            try {
                                const currentToken = await getToken(messaging, {
                                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                                });

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
                                    console.log("No registration token available.");
                                }

                                // Set up message handling
                                unsubscribeMessaging = onMessage(messaging, (payload) => {
                                    console.log("Message received in foreground. ", payload);
                                    const notificationTitle = payload.notification?.title ?? "Nouveau Message";
                                    const notificationOptions = {
                                        body: payload.notification?.body ?? "",
                                        icon: payload.notification?.icon ?? "/favicon.ico",
                                    };
                                    new Notification(notificationTitle, notificationOptions);
                                });
                            } catch (err) {
                                console.error("Error setting up Firebase messaging:", err);
                            }
                        } else {
                            console.log("Unable to get permission to notify.");
                        }
                    } catch (error) {
                        console.error("Error loading Firebase messaging:", error);
                    }
                } else {
                    console.log("Push messaging is not supported on this browser.");
                }
            }
        };

        setupMessaging();

        return () => {
            if (unsubscribeMessaging) {
                unsubscribeMessaging();
            }
        };
    }, [user]);

    const updatePhotoURLInContext = async (photoURL: string) => {
        try {
            const auth = getAuth();
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL });

                // Then update the local context state
                setUser((prevUser) => {
                    if (!prevUser) return null;
                    return {
                        ...prevUser,
                        photoURL: photoURL
                    };
                });
            }

            return true;
        } catch (error) {
            console.error("Error updating photo URL in context:", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                updatePhotoURLInContext
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};