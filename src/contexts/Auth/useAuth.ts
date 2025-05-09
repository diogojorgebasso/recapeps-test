import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextValue {
    user: User | null;
    pro: boolean;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    pro: false,
    loading: true,
});

export const useAuth = () => {
    return useContext(AuthContext);
};
