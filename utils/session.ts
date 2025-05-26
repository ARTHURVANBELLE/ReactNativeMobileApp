import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { getStorageItem, setStorageItem, deleteStorageItem } from './storage';

// Your SolidJS API base URL
const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST || 'http://localhost:3000/src/routes/api/auth/strava/url';

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
    
    // Optional: Call your API to invalidate the session if needed
    // await fetch(`${API_URL}/auth/logout`, { ... });
    
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
    
    // Call your SolidJS API's refresh token endpoint
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: authState.refreshToken,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    // Update auth state with new tokens
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
    // Generate a redirect URI that works across platforms
    const redirectUri = makeRedirectUri({
      scheme: 'your-app-scheme',
      path: 'redirect',
      // Use your custom domain for web if you have one
      preferLocalhost: Platform.OS === 'web',
    });
    
    // Get the auth URL from your SolidJS API
    const response = await fetch(`${API_URL}/auth/strava/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect_uri: redirectUri,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting Strava auth URL:', error);
    throw error;
  }
};

// Start Strava OAuth flow
export const loginWithStrava = async (): Promise<boolean> => {
  try {
    // Get auth URL from your SolidJS API
    const authUrl = await getStravaAuthUrl();
    
    // Open browser for authentication
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      Platform.OS === 'web' ? window.location.origin : 'your-app-scheme://redirect'
    );
    
    // Handle the result based on platform
    if (Platform.OS === 'web') {
      // On web, your callback will be handled by your app's routing
      // The code will be in the URL and should be extracted there
      return true;
    } else {
      // On native, parse the result URL for the auth code
      if (result.type === 'success' && result.url) {
        return await handleAuthRedirect(result.url);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Strava login failed:', error);
    return false;
  }
};

// Handle auth redirect with code
export const handleAuthRedirect = async (url: string): Promise<boolean> => {
  try {
    // Extract code from URL
    const code = new URL(url).searchParams.get('code');
    
    if (!code) {
      throw new Error('No code found in redirect URL');
    }
    
    // Exchange code for tokens via your SolidJS API
    const response = await fetch(`${API_URL}/auth/strava/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('Token exchange failed');
    }
    
    const data = await response.json();
    
    // Save the received tokens
    await saveAuthState({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      user: data.user || null,
    });
    
    return true;
  } catch (error) {
    console.error('Auth redirect handling failed:', error);
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
