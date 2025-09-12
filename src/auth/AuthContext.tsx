import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { 
  initKeycloak, 
  login as keycloakLogin, 
  logout as keycloakLogout,
  getToken,
  getIdToken,
  loadUserProfile,
  updateToken,
  addTokenRefreshCallback
} from './keycloak';

// Define the AuthContext interface
interface AuthContextProps {
  initialized: boolean;
  authenticated: boolean;
  login: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  user: any | null;
  token: string | undefined;
  idToken: string | undefined;
  refreshToken: () => Promise<boolean>;
}

// Create the AuthContext with default values
const AuthContext = createContext<AuthContextProps>({
  initialized: false,
  authenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
  token: undefined,
  idToken: undefined,
  refreshToken: async () => false,
});

// Define the AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Initialize Keycloak
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await initKeycloak();
        setAuthenticated(authenticated);
        
        if (authenticated) {
          const profile = await loadUserProfile();
          setUser(profile);
          
          // Setup token refresh callback
          addTokenRefreshCallback(() => {
            console.log('Token refreshed');
          });
        }
      } catch (error) {
        console.error('Failed to initialize Keycloak:', error);
      } finally {
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = (redirectUri?: string) => {
    keycloakLogin(redirectUri);
  };

  // Logout function
  const logout = (redirectUri?: string) => {
    setAuthenticated(false);
    setUser(null);
    keycloakLogout(redirectUri);
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      return await updateToken(5);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  // Create auth value object
  const authValue: AuthContextProps = {
    initialized,
    authenticated,
    login,
    logout,
    user,
    token: getToken(),
    idToken: getIdToken(),
    refreshToken,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

export default AuthContext;