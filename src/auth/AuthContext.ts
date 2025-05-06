import { createContext, useContext } from 'react';
import { UserInfo } from 'firebase/auth';
import { Claims } from 'next-firebase-auth-edge/lib/auth/claims';

export interface User extends UserInfo {
    idToken: string;
    customToken?: string;
    emailVerified: boolean;
    customClaims: Claims;
}

export interface AuthContextValue {
    user: User | null;
    updatePhotoURLInContext: (photoURL: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    updatePhotoURLInContext: async () => {
        return false;
    },
});

export const useAuth = () => useContext(AuthContext);