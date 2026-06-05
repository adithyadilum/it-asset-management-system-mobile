import { createContext, useContext } from 'react';

type AuthContextType = {
  setIsAuthenticated: (value: boolean) => void;
};

export const AuthContext = createContext<AuthContextType>({
  setIsAuthenticated: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
