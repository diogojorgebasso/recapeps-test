'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { collection, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from './useAuth';

interface SubscriptionContextProps {
    isSubscribed: boolean;
    isLoading: boolean;
    lastPurchaseDate: Date | null;
    subscriptionEndsAt: Date | null;
    subscriptionData: any | null;
}

const SubscriptionContext = createContext<SubscriptionContextProps | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastPurchaseDate, setLastPurchaseDate] = useState<Date | null>(null);
    const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null);
    const [subscriptionData, setSubscriptionData] = useState<any | null>(null);

    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            setIsSubscribed(false);
            return () => { };
        }

        setIsLoading(true);

        // Check for active subscriptions in Firestore
        const subscriptionsRef = collection(db, 'users', currentUser.uid, 'subscriptions');
        const unsubscribe = onSnapshot(subscriptionsRef, async (snapshot) => {
            let hasActiveSubscription = false;
            let latestSubscription = null;
            let latestEndDate = null;
            let latestPurchaseDate = null;

            if (!snapshot.empty) {
                snapshot.docs.forEach(doc => {
                    const data = doc.data();

                    // Check if subscription is active
                    if (data.status === 'active' || data.status === 'trialing') {
                        hasActiveSubscription = true;

                        // Keep track of the latest subscription
                        const currentEndDate = data.current_period_end?.toDate() || null;
                        const currentPurchaseDate = data.created?.toDate() || null;

                        if (!latestEndDate || (currentEndDate && currentEndDate > latestEndDate)) {
                            latestEndDate = currentEndDate;
                            latestPurchaseDate = currentPurchaseDate;
                            latestSubscription = { id: doc.id, ...data };
                        }
                    }
                });
            }

            setIsSubscribed(hasActiveSubscription);
            setSubscriptionData(latestSubscription);
            setSubscriptionEndsAt(latestEndDate);
            setLastPurchaseDate(latestPurchaseDate);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const value = {
        isSubscribed,
        isLoading,
        lastPurchaseDate,
        subscriptionEndsAt,
        subscriptionData
    };

    return (
        <SubscriptionContext.Provider value= { value } >
        { children }
        </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextProps {
    const context = useContext(SubscriptionContext);
    if (context === null) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
}