import { createContext, useContext } from 'react';

type AuthContextType = {
  sessionNotice: string | null;
  setIsAuthenticated: (value: boolean) => void;
  /** Clears the stored token and returns the app to the pairing screen. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  sessionNotice: null,
  setIsAuthenticated: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
