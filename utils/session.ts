import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { getStorageItem, setStorageItem, deleteStorageItem } from './storage';

// API URL configuration
const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST || 'http://localhost:3000';
const isDev = process.env.NODE_ENV === 'development';

// Helper function for API requests that properly handles CORS
const fetchWithCORS = async (url: string, options: RequestInit = {}) => {
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };
  
  // Add CORS handling for web requests
  if (Platform.OS === 'web') {
    fetchOptions.credentials = 'include';
    fetchOptions.mode = 'cors';
  }
  
  try {
    return await fetch(url, fetchOptions);
  } catch (error) {
    if (error instanceof Error && error.message.includes('CORS')) {
      console.error('CORS ERROR: This is a server-side configuration issue.');
      console.error('Please configure your server to allow cross-origin requests from:', 
                    Platform.OS === 'web' ? window.location.origin : 'your mobile app');
    }
    throw error;
  }
};

// Authentication state interface
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: any | null;
}

// Initialize auth state
let authState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
};

// Authentication listeners for real-time updates
const authListeners: Array<(isAuth: boolean) => void> = [];

// Register a listener for auth state changes
export const addAuthStateListener = (listener: (isAuth: boolean) => void) => {
  authListeners.push(listener);
  return () => {
    const index = authListeners.indexOf(listener);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};

// Notify all listeners about auth state changes
const notifyAuthStateChange = (isAuth: boolean) => {
  authListeners.forEach(listener => listener(isAuth));
};

// Load auth state from storage
export const loadAuthState = async (): Promise<AuthState> => {
  try {
    const accessToken = await getStorageItem('strava_access_token');
    const refreshToken = await getStorageItem('strava_refresh_token');
    const expiresAt = await getStorageItem('strava_token_expiry');
    const userJson = await getStorageItem('user_data');
    
    authState = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt ? Number(expiresAt) : null,
      user: userJson ? JSON.parse(userJson) : null,
    };
    
    return authState;
  } catch (error) {
    console.error('Error loading auth state:', error);
    return authState;
  }
};

// Save auth state to storage
export const saveAuthState = async (state: AuthState) => {
  try {
    if (state.accessToken) {
      await setStorageItem('strava_access_token', state.accessToken);
    }
    if (state.refreshToken) {
      await setStorageItem('strava_refresh_token', state.refreshToken);
    }
    if (state.expiresAt) {
      await setStorageItem('strava_token_expiry', state.expiresAt.toString());
    }
    if (state.user) {
      await setStorageItem('user_data', JSON.stringify(state.user));
    }
    
    authState = state;
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
};

// Clear auth state
export const logout = async () => {
  try {
    await deleteStorageItem('strava_access_token');
    await deleteStorageItem('strava_refresh_token');
    await deleteStorageItem('strava_token_expiry');
    await deleteStorageItem('user_data');
    
    authState = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
    };
    
    notifyAuthStateChange(false);
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Check if user is logged in and token is valid
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    if (!authState.accessToken) {
      await loadAuthState();
    }
    
    if (!authState.accessToken || !authState.expiresAt) {
      return false;
    }
    
    // Check if token is expired or about to expire (5 minute buffer)
    if (authState.expiresAt < Date.now() + 5 * 60 * 1000) {
      return await refreshAccessToken();
    }
    
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

// Refresh access token using the refresh token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    if (!authState.refreshToken) {
      await loadAuthState();
      if (!authState.refreshToken) return false;
    }
    
    const response = await fetchWithCORS(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: authState.refreshToken,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    await saveAuthState({
      ...authState,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || authState.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    });
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Get Strava auth URL from your backend
export const getStravaAuthUrl = async (): Promise<string> => {
  try {
    // Generate redirect URI
    const redirectUri = `${API_URL}/api/auth/strava/mobile-callback`;
    
    // Try alternative approach for development if CORS is an issue
    if (Platform.OS === 'web' && isDev) {
      try {
        const altFetchOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            redirect_uri: redirectUri,
            platform: Platform.OS,
          }),
          mode: 'cors',
          credentials: 'same-origin'
        };
        
        const response = await fetch(`${API_URL}/api/auth/strava/url`, altFetchOptions);
        
        if (response.ok) {
          const data = await response.json();
          if (data.url) return data.url;
        }
      } catch (e) {
        // Fall back to normal fetch if alternative fails
      }
    }
    
    // Standard request with CORS handling
    const response = await fetchWithCORS(`${API_URL}/api/auth/strava/url`, {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri: redirectUri,
        platform: Platform.OS,
      }),
    });
    
    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;
      throw new Error(`Failed to get auth URL: ${status} ${statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server did not return JSON');
    }
    
    const data = await response.json();
    
    if (!data.url) {
      throw new Error('Response missing URL field');
    }
    
    return data.url;
  } catch (error) {
    console.error('Error getting Strava auth URL:', error);
    throw error;
  }
};

// Extract auth data from URL
export function extractAuthData(url: string): any | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // For direct auth data in URL
    if (params.has('access_token')) {
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        expires_at: params.get('expires_at'),
        user: params.has('user') ? JSON.parse(decodeURIComponent(params.get('user') || '{}')) : null
      };
    }
    
    // For code flow
    if (params.has('code')) {
      return {
        code: params.get('code'),
        state: params.get('state')
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Handle auth redirect (for mobile)
export const handleAuthRedirect = async (url: string): Promise<boolean> => {
  try {
    const authData = extractAuthData(url);
    if (!authData) return false;
    
    return await processStravaAuthResponse(authData);
  } catch (error) {
    return false;
  }
};

// Check authentication status from backend
export const checkAuthStatus = async (sessionId?: string): Promise<{isAuthenticated: boolean, authData?: any}> => {
  try {
    const url = new URL(`${API_URL}/api/auth/status`);
    if (sessionId) url.searchParams.append('session_id', sessionId);
    url.searchParams.append('_t', Date.now().toString());
    
    let response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
    } catch (e) {
      // Fallback to fetchWithCORS
      response = await fetchWithCORS(url.toString(), { method: 'GET' });
    }
    
    if (!response.ok) {
      return { isAuthenticated: false };
    }
    
    const data = await response.json();
    
    if (data.isAuthenticated && data.access_token) {
      await storeAuthDataDirectly({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user
      });
      
      return { isAuthenticated: true, authData: data };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    return { isAuthenticated: false };
  }
};

// Start Strava OAuth flow
export const loginWithStrava = async (): Promise<boolean> => {
  try {
    const authUrl = await getStravaAuthUrl();
    
    // Generate session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    await setStorageItem('strava_auth_session', sessionId);
    
    // Clear existing storage data (web only)
    if (Platform.OS === 'web') {
      if (window.localStorage) window.localStorage.removeItem('strava_auth_data');
      if (window.sessionStorage) window.sessionStorage.removeItem('strava_auth_data');
    }
    
    // Add session to auth URL
    const authUrlWithSession = authUrl + (authUrl.includes('?') ? '&' : '?') + 
                               `state=${sessionId}`;
    
    if (Platform.OS === 'web') {
      // Web authentication with popup
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const features = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`;
      const authWindow = window.open(authUrlWithSession, 'StravaAuth', features);
      
      if (!authWindow) {
        return false;
      }
      
      return new Promise((resolve) => {
        let pollCount = 0;
        const maxPolls = 240;
        
        const pollInterval = setInterval(async () => {
          // Check auth status every 5 seconds
          if (pollCount % 5 === 0) {
            const { isAuthenticated } = await checkAuthStatus(sessionId);
            if (isAuthenticated) {
              clearInterval(pollInterval);
              if (!authWindow.closed) authWindow.close();
              resolve(true);
              return;
            }
          }
          
          // Handle window closure
          if (authWindow.closed) {
            clearInterval(pollInterval);
            
            setTimeout(async () => {
              // Check storage first
              if (Platform.OS === 'web') {
                try {
                  if (window.localStorage && window.localStorage.getItem('strava_auth_data')) {
                    const authData = JSON.parse(window.localStorage.getItem('strava_auth_data')!);
                    window.localStorage.removeItem('strava_auth_data');
                    
                    if (authData && authData.access_token) {
                      const success = await storeAuthDataDirectly(authData);
                      resolve(success);
                      return;
                    }
                  }
                } catch (e) {}
              }
              
              // Fall back to status check
              const { isAuthenticated } = await checkAuthStatus(sessionId);
              resolve(isAuthenticated);
            }, 1000);
            return;
          }
          
          // Handle timeout
          if (++pollCount >= maxPolls) {
            clearInterval(pollInterval);
            if (!authWindow.closed) authWindow.close();
            resolve(false);
          }
        }, 1000);
      });
    } else {
      // Mobile authentication
      const result = await WebBrowser.openAuthSessionAsync(
        authUrlWithSession,
        'stravaauth://auth-callback'
      );
      
      if (result.type === 'success' && result.url) {
        return await handleAuthRedirect(result.url);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Strava login failed:', error);
    return false;
  }
};

// Store auth data directly
export const storeAuthDataDirectly = async (authData: any): Promise<boolean> => {
  try {
    if (!authData || !authData.access_token) {
      return false;
    }
    
    const expiresAt = authData.expires_at 
      ? Number(authData.expires_at) * 1000
      : (Date.now() + 6 * 60 * 60 * 1000);
      
    const userData = authData.user || authData.athlete || null;
    
    await saveAuthState({
      accessToken: authData.access_token,
      refreshToken: authData.refresh_token || null,
      expiresAt: expiresAt,
      user: userData,
    });
    
    notifyAuthStateChange(true);
    return true;
  } catch (error) {
    return false;
  }
};

// Process Strava auth response
export const processStravaAuthResponse = async (authData: any): Promise<boolean> => {
  try {
    // If we received direct auth data with tokens
    if (authData.access_token) {
      return await storeAuthDataDirectly(authData);
    }
    
    // If we received an auth code that needs to be exchanged
    if (authData.code) {
      const response = await fetchWithCORS(`${API_URL}/api/auth/strava/token`, {
        method: 'POST',
        body: JSON.stringify({
          code: authData.code,
          state: authData.state
        })
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const tokenData = await response.json();
      return await storeAuthDataDirectly(tokenData);
    }

    return false;
  } catch (error) {
    return false;
  }
};

// Get current user data
export const getCurrentUser = async () => {
  if (!authState.user) {
    await loadAuthState();
  }
  return authState.user;
};
