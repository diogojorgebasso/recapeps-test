import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextValue {
    user: User | null;
    updatePhotoURLInContext: (photoURL: string) => Promise<boolean>;
    pro: boolean;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    updatePhotoURLInContext: async () => {
        return false;
    },
    pro: false,
    loading: true,
});

export const useAuth = () => {
    return useContext(AuthContext);
};
