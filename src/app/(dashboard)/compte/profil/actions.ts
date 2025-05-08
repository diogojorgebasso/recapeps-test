'use server'

import { getAuth, } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';

/**
 * Updates a user's email address after verifying their current password
 */
export async function handleEmailChange(password: string, newEmail: string) {
    try {
        const { user } = await getAuthenticatedAppForUser(); // Assuming this function gets the authenticated user

        if (!user) {
            throw new Error('Utilisateur non authentifié');
        }

        await getAuth().updateUser(user.uid, {
            email: newEmail,
            emailVerified: false,
        });

        await getAuth().generateEmailVerificationLink(newEmail);

        return { success: true, message: 'Email mis à jour. Veuillez vérifier votre nouvelle adresse email.' };
    } catch (error: any) {
        console.error('Error updating email:', error);
        return {
            success: false,
            error: error.message,
            code: error.code || 'unknown-error'
        };
    }
}

/**
 * Updates a user's display name
 */
export async function updateUserName(firstName: string, lastName: string) {
    try {
        const { user } = await getAuthenticatedAppForUser(); // Assuming this function gets the authenticated user
        const displayName = `${firstName} ${lastName}`.trim();

        if (!user) {
            throw new Error('Utilisateur non authentifié');
        }
        // Update user in Firebase Auth
        await getAuth().updateUser(user.uid, { displayName });

        // Update in Firestore too if you keep user data there
        const db = getFirestore();
        await db.collection('users').doc(user.uid).update({
            displayName,
            firstName,
            lastName,
            updatedAt: new Date()
        });

        return { success: true, displayName };
    } catch (error: any) {
        console.error('Error updating user name:', error);
        return {
            success: false,
            error: error.message,
            code: error.code || 'unknown-error'
        };
    }
}

