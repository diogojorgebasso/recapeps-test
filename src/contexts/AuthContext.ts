import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextValue {
    user: User | null;
    updatePhotoURLInContext: (photoURL: string) => Promise<boolean>;
    pro: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    updatePhotoURLInContext: async () => {
        return false;
    },
    pro: false,
});

export const useAuth = () => useContext(AuthContext);

