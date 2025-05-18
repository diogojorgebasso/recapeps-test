import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/clientApp';

export const callUpdateUserName = httpsCallable<
    { firstName: string; lastName: string },
    { success: boolean; displayName?: string; error?: string }
>(functions, 'updateusername');

export const callHandleEmailChange = httpsCallable<
    { newEmail: string },
    { success: boolean; message?: string; error?: string }
>(functions, 'handleemailchange');

export const callCreatePortal = httpsCallable<
    {},
    { url?: string; error?: string }
>(functions, 'createportalsession');
