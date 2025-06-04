import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { getStorageItem, setStorageItem, deleteStorageItem } from './storage';

// Function to log authentication data with better visibility
const logAuthData = (label: string, data: any) => {
  try {
    console.log(`🔐 [AUTH DEBUG] ${label}:`);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`🔐 [AUTH DEBUG] ${label}: [Error stringifying data]`, error);
    console.log('Raw data:', data);
  }
};

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
  jwtToken: string | null;
  stravaId: number | null;
  user: any | null;
}

// Initialize auth state
let authState: AuthState = {
  jwtToken: null,
  stravaId: null,
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
    const jwtToken = await getStorageItem('jwt_token');
    const stravaId = await getStorageItem('strava_id');
    const userJson = await getStorageItem('user_data');
    
    authState = {
      jwtToken: jwtToken,
      stravaId: stravaId ? Number(stravaId) : null,
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
    
    if (state.jwtToken) {
      await setStorageItem('jwt_token', state.jwtToken);
    } else {
      await deleteStorageItem('jwt_token');
    }
    
    if (state.stravaId) {
      await setStorageItem('strava_id', String(state.stravaId));
    } else {
      await deleteStorageItem('strava_id');
    }
    
    if (state.user) {
      await setStorageItem('user_data', JSON.stringify(state.user));
    } else {
      await deleteStorageItem('user_data');
    }
    
    authState = state;
    notifyAuthStateChange(!!(state.jwtToken));
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
};

// Check if user is logged in
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    if (!authState.jwtToken) {
      await loadAuthState();
    }
    
    return !!authState.jwtToken;
  } catch (error) {
    console.error('Authentication check failed:', error);
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
    logAuthData('Extracting auth data from URL', { url });
    
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Log all URL parameters for debugging
    const allParams: Record<string, string> = {};
    params.forEach((value, key) => {
      allParams[key] = value;
    });
    logAuthData('URL parameters', allParams);
    
    // Check for data parameter that contains JSON
    if (params.has('data')) {
      try {
        const parsed = JSON.parse(decodeURIComponent(params.get('data') || '{}'));
        logAuthData('Parsed data parameter', parsed);
        return parsed;
      } catch (e) {
        console.error('Failed to parse data parameter:', e);
      }
    }
    
    // For direct auth data in URL
    if (params.has('jwt_token')) {
      const authData = {
        jwt_token: params.get('jwt_token'),
        stravaId: params.has('stravaId') ? Number(params.get('stravaId')) : null,
        user: params.has('user') ? JSON.parse(decodeURIComponent(params.get('user') || '{}')) : null
      };
      logAuthData('Direct auth data from URL', authData);
      return authData;
    }
    
    // For code flow
    if (params.has('code')) {
      const authData = {
        code: params.get('code'),
        state: params.get('state')
      };
      logAuthData('Code flow auth data', authData);
      return authData;
    }
    
    console.warn('No recognizable auth data in URL');
    return null;
  } catch (error) {
    console.error('Error extracting auth data:', error);
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
    
    console.log(`Checking auth status with sessionId: ${sessionId || 'none'}`);
    
    let response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
    } catch (e) {
      // Fallback to fetchWithCORS
      console.log('Falling back to fetchWithCORS for auth status check');
      response = await fetchWithCORS(url.toString(), { method: 'GET' });
    }
    
    if (!response.ok) {
      console.warn(`Auth status check failed with status: ${response.status}`);
      return { isAuthenticated: false };
    }
    
    const data = await response.json();
    logAuthData('Auth status response', data);
    
    // Handle the JWT token format from your backend
    if (data.isAuthenticated) {
      // Load current auth state to preserve JWT if it's not in the response
      const currentAuthState = await loadAuthState();
      
      // Create complete auth data by merging response with existing token
      const completeAuthData = {
        jwt_token: data.jwt_token || currentAuthState.jwtToken,
        stravaId: data.stravaId || data.user?.id,
        user: data.user
      };
      
      logAuthData('Complete auth data for storage', completeAuthData);
      
      // Store combined data
      await storeAuthDataDirectly(completeAuthData);
      
      return { isAuthenticated: true, authData: data };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Error checking auth status:', error);
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
        console.error('Failed to open auth popup window');
        return false;
      }
      
      // Add message event listener to receive auth data directly
      const messageHandler = async (event: MessageEvent) => {
        try {
          console.log('Received message event in parent window');
          if (event.data && typeof event.data === 'object' && event.data.type === 'strava-auth-complete') {
            console.log('Received strava-auth-complete message', 
                      event.data.authData ? 'with auth data' : 'without auth data');
            
            if (event.data.authData) {
              window.removeEventListener('message', messageHandler);
              const success = await storeAuthDataDirectly(event.data.authData);
              if (success) {
                if (!authWindow.closed) authWindow.close();
              }
            }
          }
        } catch (e) {
          console.error('Error processing message event:', e);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
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
                    
                    console.log('Retrieved auth data from localStorage:', 
                      authData.jwt_token ? 'JWT present' : 'JWT missing',
                      authData.stravaId ? 'StravaId present' : 'StravaId missing');
                    
                    // Check for JWT token
                    if (authData && (authData.jwt_token)) {
                      const success = await storeAuthDataDirectly(authData);
                      resolve(success);
                      return;
                    }
                  }
                } catch (e) {
                  console.error('Error processing auth data from storage:', e);
                }
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

// Clear auth state
export const logout = async () => {
  try {
    // Clear all auth-related local storage
    await deleteStorageItem('jwt_token');
    await deleteStorageItem('strava_id');
    await deleteStorageItem('user_data');
    await deleteStorageItem('strava_auth_session');
    
    // Reset auth state
    authState = {
      jwtToken: null,
      stravaId: null,
      user: null,
    };
    
    notifyAuthStateChange(false);
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Store auth data directly
export const storeAuthDataDirectly = async (authData: any): Promise<boolean> => {
  try {
    if (!authData) {
      console.warn("No auth data provided to store");
      return false;
    }
    
    logAuthData('Storing auth data', authData);
    
    // Load current auth state
    const currentAuthState = await loadAuthState();
    
    // Extract user data from the response format
    const userData = authData.user || null;
    
    // Store JWT, and Strava ID - preserve JWT if it's not in the new data
    const newAuthState: AuthState = {
      jwtToken: authData.jwt_token || currentAuthState.jwtToken,
      stravaId: authData.stravaId || (userData?.id || currentAuthState.stravaId),
      user: userData || currentAuthState.user,
    };
    
    logAuthData('New auth state', newAuthState);
    
    // Allow storing just user data even if tokens are missing
    // This can happen when user data comes directly from API
    if (authData.stravaId || userData?.id || newAuthState.jwtToken) {
      await saveAuthState(newAuthState);
      notifyAuthStateChange(true);
      return true;
    }
    
    if (!newAuthState.jwtToken) {
      console.warn("No JWT token available in auth data and none preserved from previous state");
      console.log("Auth data keys:", Object.keys(authData));
      return false;
    }
    
    await saveAuthState(newAuthState);
    notifyAuthStateChange(true);
    return true;
  } catch (error) {
    console.error("Error storing auth data directly:", error);
    return false;
  }
};

// Process Strava auth response
export const processStravaAuthResponse = async (authData: any): Promise<boolean> => {
  try {
    logAuthData('Processing Strava auth response', authData);
    
    // If we received direct auth data with tokens (JWT)
    if (authData.jwt_token) {
      return await storeAuthDataDirectly(authData);
    }
    
    // If we received an auth code that needs to be exchanged
    if (authData.code) {
      const requestBody = {
        code: authData.code,
        state: authData.state
      };
      logAuthData('Sending code exchange request', requestBody);
      
      const response = await fetchWithCORS(`${API_URL}/api/auth/strava/token`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token exchange failed with status ${response.status}:`, errorText);
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      // Log raw response to debug issues with response format
      const responseText = await response.text();
      logAuthData('Token exchange raw response', responseText);
      
      // Try to parse the response as JSON
      let tokenData;
      try {
        tokenData = JSON.parse(responseText);
      } catch(e) {
        console.error('Failed to parse token response as JSON', e);
        throw new Error('Invalid JSON response from token endpoint');
      }
      
      logAuthData('Token exchange parsed response', tokenData);
      
      // If jwt_token is missing but we have it in another field, extract it
      if (!tokenData.jwt_token) {
        // Look for token in various possible fields
        const possibleTokenFields = ['token', 'jwt', 'access_token', 'id_token', 'accessToken', 'jwt_token'];
        for (const field of possibleTokenFields) {
          if (tokenData[field]) {
            console.log(`Found JWT token in field: ${field}`);
            tokenData.jwt_token = tokenData[field];
            break;
          }
        }
        
        // Also check nested response structures
        if (!tokenData.jwt_token && tokenData.response?.token) {
          tokenData.jwt_token = tokenData.response.token;
        }
      }
      
      return await storeAuthDataDirectly(tokenData);
    }

    console.warn("Auth data contains neither tokens nor code");
    return false;
  } catch (error) {
    console.error('Error processing Strava auth response:', error);
    return false;
  }
};

// Get JWT token for API requests
export const getJwtToken = async (): Promise<string | null> => {
if (!authState.jwtToken) {
  await loadAuthState();
}

if (!authState.jwtToken) {
  throw new Error('No JWT token available');
}

return authState.jwtToken;
};

// Get Strava ID from session
export const getStravaId = async (): Promise<number | null> => {
  if (!authState.stravaId) {
    await loadAuthState();
  }
  return authState.stravaId;
};

// Get current user data
export const getCurrentUser = async () => {
  if (!authState.user) {
    await loadAuthState();
  }
  return authState.user;
};

// Get auth credentials (JWT token and Strava ID)
export const getAuthCredentials = async (): Promise<{ jwtToken: string | null, stravaId: number | null }> => {
  if (!authState.jwtToken || !authState.stravaId) {
    await loadAuthState();
  }
  
  return {
    jwtToken: authState.jwtToken,
    stravaId: authState.stravaId
  };
};

// Helper function for authenticated API requests using JWT
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const jwt = await getJwtToken();
  
  const authOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${jwt}`,


  },  };
  return await fetchWithCORS(url, authOptions);
};