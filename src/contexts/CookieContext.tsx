'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { firebaseApp } from '@/lib/firebase/clientApp';

type ConsentCtx = { consentGiven: boolean | null; setConsent: (v: boolean) => void };
const CookieContext = createContext<ConsentCtx | undefined>(undefined);

export const useCookieConsent = () => {
    const ctx = useContext(CookieContext);
    if (!ctx) throw new Error('useCookieConsent must be used inside CookieProvider');
    return ctx;
};

export const CookieProvider = ({ children }: { children: React.ReactNode }) => {
    const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

    // read persisted choice
    useEffect(() => {
        const stored = window.localStorage.getItem('consent');
        if (stored !== null) setConsentGiven(stored === 'true');
    }, []);

    // lazily create Analytics / Performance *after* we know the choice
    useEffect(() => {
        if (consentGiven === null) return;
        import('firebase/analytics').then(({ getAnalytics, setAnalyticsCollectionEnabled }) => {
            const analytics = getAnalytics(firebaseApp);
            setAnalyticsCollectionEnabled(analytics, consentGiven);
        });
        import('firebase/performance').then(({ getPerformance }) => {
            const perf = getPerformance(firebaseApp);
        });
    }, [consentGiven]);

    const setConsent = (v: boolean) => {
        setConsentGiven(v);
        window.localStorage.setItem('consent', String(v));
    };

    return (
        <CookieContext.Provider value={{ consentGiven, setConsent }}>
            {children}
        </CookieContext.Provider>
    );
};
