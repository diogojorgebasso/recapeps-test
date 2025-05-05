'use server'

import { cookies } from 'next/headers';
import { getAuth, } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Updates a user's email address after verifying their current password
 */
export async function handleEmailChange(password: string, newEmail: string) {
    try {
        const sessionCookie = (await cookies()).get('AuthToken')?.value;
        if (!sessionCookie) {
            throw new Error('Utilisateur non authentifié');
        }

        // Verify session
        const decodedToken = await getAuth().verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;

        // Update email in Firebase Auth
        await getAuth().updateUser(uid, {
            email: newEmail,
            emailVerified: false, // Reset verification status
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
        const sessionCookie = (await cookies()).get('AuthToken')?.value;
        if (!sessionCookie) {
            throw new Error('Utilisateur non authentifié');
        }

        // Verify session
        const decodedToken = await getAuth().verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;

        // Format the display name (firstName + lastName)
        const displayName = `${firstName} ${lastName}`.trim();

        // Update user in Firebase Auth
        await getAuth().updateUser(uid, { displayName });

        // Update in Firestore too if you keep user data there
        const db = getFirestore();
        await db.collection('users').doc(uid).update({
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

/**
 * Gets the current email notification preference for a user
 */
export async function isEmailNotificationEnabled() {
    try {
        const sessionCookie = (await cookies()).get('AuthToken')?.value;
        if (!sessionCookie) {
            throw new Error('Utilisateur non authentifié');
        }

        // Verify session
        const decodedToken = await getAuth().verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;

        // Get user preferences from Firestore
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            return false; // Default to false if no preferences found
        }

        const userData = userDoc.data();
        return userData?.preferences?.emailNotifications ?? false;

    } catch (error: any) {
        console.error('Error checking email notifications status:', error);
        // Default to false in case of error
        return false;
    }
}

/**
 * Updates a user's email notification preferences
 */
export async function updateEmailNotificationPreference(enabled: boolean) {
    try {
        const sessionCookie = (await cookies()).get('AuthToken')?.value;
        if (!sessionCookie) {
            throw new Error('Utilisateur non authentifié');
        }

        // Verify session
        const decodedToken = await getAuth().verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;

        const db = getFirestore();
        await db.collection('users').doc(uid).update({
            'preferences.emailNotifications': enabled,
            updatedAt: new Date()
        });

        return { success: true, enabled };
    } catch (error: any) {
        console.error('Error updating email notification preference:', error);
        return {
            success: false,
            error: error.message,
            code: error.code || 'unknown-error'
        };
    }
}