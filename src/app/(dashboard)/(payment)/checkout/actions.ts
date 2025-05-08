'use client';

import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export async function fetchClientSecret(priceId: string) {
    const user = getAuth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const userDocRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) throw new Error('User data not found');

    const userData = userSnapshot.data();

    const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: userData.email,
            name: userData.name,
            firebaseUID: user.uid,
            priceId,
        }),
    });

    const { clientSecret } = await res.json();
    return clientSecret;
}
