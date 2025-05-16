"use client"
import { useState, useCallback } from 'react';
import { uploadUserAvatar } from '@/lib/firebase/storage';
import { updateDoc, doc, getFirestore } from 'firebase/firestore';
import { toaster } from '@/components/ui/toaster';
import { useUserWithClaims } from '@/lib/getUser';

export function useProfilePhoto() {
    const { user } = useUserWithClaims();
    const [loading, setLoading] = useState(false);
    const db = getFirestore();

    const savePhoto = useCallback(
        async (blob: Blob) => {
            if (!user) return;
            setLoading(true);
            const url = await uploadUserAvatar(user.uid, blob);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
            toaster.create({
                type: 'success',
                title: 'Photo de profil mise à jour',
            });
            setLoading(false);
            return url;
        },
        [user, db]
    );

    return { savePhoto, loading };
}
