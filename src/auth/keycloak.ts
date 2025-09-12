import Keycloak from 'keycloak-js';

// Keycloak initialization options
const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080', // Replace with your Keycloak server URL
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'myrealm', // Replace with your realm name
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'maplibre-app', // Replace with your client ID
};

// Create Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

/**
 * Initializes Keycloak authentication with implicit flow
 * @returns Promise that resolves when Keycloak is initialized
 */
export const initKeycloak = (): Promise<boolean> => {
  return keycloak.init({
    onLoad: 'check-sso', // check-sso will avoid redirecting if not logged in
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    checkLoginIframe: false, // Disable iframe-based token renewal to simplify the flow
    flow: 'implicit', // Use implicit flow as requested
    pkceMethod: 'S256', // Add PKCE for extra security (optional with implicit flow)
  });
};

/**
 * Get authentication status
 * @returns True if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!keycloak.authenticated;
};

/**
 * Login user
 * @param redirectUri - Optional redirect URI after login
 */
export const login = (redirectUri?: string): void => {
  keycloak.login({
    redirectUri: redirectUri || window.location.href,
  });
};

/**
 * Logout user
 * @param redirectUri - Optional redirect URI after logout
 */
export const logout = (redirectUri?: string): void => {
  keycloak.logout({
    redirectUri: redirectUri || window.location.origin,
  });
};

/**
 * Get the user's profile information
 * @returns Promise that resolves with user profile
 */
export const loadUserProfile = (): Promise<Keycloak.KeycloakProfile> => {
  return keycloak.loadUserProfile();
};

/**
 * Get the ID token
 * @returns ID token or undefined
 */
export const getIdToken = (): string | undefined => {
  return keycloak.idToken;
};

/**
 * Get the access token
 * @returns Access token or undefined
 */
export const getToken = (): string | undefined => {
  return keycloak.token;
};

/**
 * Update token if it's expired
 * @param minValidity - Seconds until token is valid
 * @returns Promise that resolves with boolean indicating success
 */
export const updateToken = (minValidity: number = 5): Promise<boolean> => {
  return keycloak.updateToken(minValidity);
};

/**
 * Add a token refresh callback
 * @param callback - Function to call when token is refreshed
 */
export const addTokenRefreshCallback = (callback: () => void): void => {
  keycloak.onTokenExpired = () => {
    keycloak.updateToken(5)
      .then(() => callback())
      .catch(() => {
        console.error('Failed to refresh token');
      });
  };
};

export default keycloak;