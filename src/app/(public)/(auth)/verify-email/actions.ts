'use server';

import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/lib/firebaseAdmin'; // Assuming you have this helper

export async function checkEmailVerified(uid: string): Promise<boolean> {
    try {
        await initializeAdminApp(); // Ensure admin app is initialized
        const userRecord = await getAuth().getUser(uid);
        return userRecord.emailVerified;
    } catch (error) {
        console.error("Error checking email verification status:", error);
        return false; // Return false on error
    }
}
