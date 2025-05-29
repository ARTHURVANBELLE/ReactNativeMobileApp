import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { getStorageItem, setStorageItem, deleteStorageItem } from './storage';

// Fix the API URL - add dev flag to handle CORS in development
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
    
    // If in development, use a CORS proxy for local development if needed
    if (isDev && url.includes('localhost')) {
      console.log('Using CORS settings for local development');
      console.log('If you see CORS errors, make sure your server has the following headers:');
      console.log('- Access-Control-Allow-Origin: http://localhost:8081');
      console.log('- Access-Control-Allow-Credentials: true');
      console.log('- Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
      console.log('- Access-Control-Allow-Headers: Content-Type,Authorization,Accept');
      
      // Debug information about the preflight request
      console.log('IMPORTANT: The preflight OPTIONS request must also include these headers');
      console.log('Check if your server properly handles OPTIONS requests');
      console.log('Common issue: middleware may not be applying headers to OPTIONS requests');
    }
  }
  
  // Wrap in try/catch to provide better error messages for CORS issues
  try {
    return await fetch(url, fetchOptions);
  } catch (error) {
    if (error instanceof Error && error.message.includes('CORS')) {
      console.error('CORS ERROR: This is a server-side configuration issue.');
      console.error('Please configure your SolidJS server to allow cross-origin requests from:', 
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
    
    // Call your SolidJS API's refresh token endpoint with CORS handling
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
    // Generate a proper redirect URI that Strava will accept
    // For Strava, the redirect URI must be exactly as registered in your Strava application
    let redirectUri;
    
    if (Platform.OS === 'web') {
      // For web, use the full server URL (not a path)
      redirectUri = `${API_URL}/api/auth/strava/mobile-callback`;
    } else {
      // For mobile apps, use a custom URL scheme or the server URL
      // This must exactly match what you've registered with Strava
      redirectUri = `${API_URL}/api/auth/strava/mobile-callback`;
      
      // If you've registered a custom URL scheme with Strava, use that instead:
      // redirectUri = 'your-app-scheme://redirect';
    }
    
    console.log('Requesting auth URL with redirect URI:', redirectUri);
    
    // Fix the endpoint path and log it
    const fullUrl = `${API_URL}/api/auth/strava/url`;
    console.log('Requesting from URL:', fullUrl);
    
    // For debugging CORS issues in web mode
    if (Platform.OS === 'web' && isDev) {
      console.log('=== CORS TROUBLESHOOTING GUIDE ===');
      console.log('1. Ensure your SolidJS server has these CORS headers configured:');
      console.log('   - Access-Control-Allow-Origin: http://localhost:8081');
      console.log('   - Access-Control-Allow-Credentials: true (must be exactly "true")');
      console.log('   - Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
      console.log('   - Access-Control-Allow-Headers: Content-Type,Authorization,Accept');
      console.log('2. Your server must respond properly to OPTIONS preflight requests');
      console.log('3. You need a route handler for the redirect URI:', redirectUri);
      console.log('==============================');
    }
    
    // Alternative approach for development if CORS is an issue
    if (Platform.OS === 'web' && isDev) {
      console.log('Development mode detected, attempting request with modified CORS settings');
      
      // Try a different credentials mode as a workaround
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
        // Try without credentials mode first if your server isn't properly configured
        credentials: 'same-origin'
      };
      
      try {
        const response = await fetch(fullUrl, altFetchOptions);
        
        if (response.ok) {
          console.log('Alternative fetch method succeeded. Server should be configured for credentials:include');
          const data = await response.json();
          return data.url;
        } else {
          console.log('Alternative fetch failed, continuing with normal fetch');
        }
      } catch (e) {
        console.log('Alternative fetch approach failed, trying normal fetch');
      }
    }
    
    // Get the auth URL from your SolidJS API with CORS handling
    const response = await fetchWithCORS(fullUrl, {
      method: 'POST',
      body: JSON.stringify({
        redirect_uri: redirectUri,
        platform: Platform.OS,
      }),
    });
    
    // Check if response is OK
    if (!response.ok) {
      // Log error details
      const statusText = response.statusText;
      const status = response.status;
      const responseText = await response.text();
      console.error('Error response:', status, statusText);
      console.error('Response body:', responseText.substring(0, 200) + '...');
      throw new Error(`Failed to get auth URL: ${status} ${statusText}`);
    }
    
    // Try to parse response as JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Received non-JSON response:', text.substring(0, 200) + '...');
      throw new Error('Server did not return JSON');
    }
    
    const data = await response.json();
    
    // Validate the response format
    if (!data.url) {
      console.error('Invalid response format:', data);
      throw new Error('Response missing URL field');
    }
    
    console.log('Auth URL received:', data.url.substring(0, 50) + '...');
    return data.url;
  } catch (error) {
    console.error('Error getting Strava auth URL:', error);
    if (Platform.OS === 'web' && error instanceof TypeError && error.message.includes('NetworkError')) {
      console.error('=== CORS ERROR DETECTED ===');
      console.error('This is likely a CORS configuration issue on your server.');
      console.error('Make sure your SolidJS server is:');
      console.error('1. Running and accessible at', API_URL);
      console.error('2. Properly configured with CORS headers for', 'http://localhost:8081');
      console.error('3. Setting Access-Control-Allow-Credentials: true (not as empty string)');
      console.error('4. IMPORTANT: Headers must be set on OPTIONS preflight requests too');
      console.error('5. Check if CORS middleware is correctly processing OPTIONS requests');
      console.error('6. Typical server setup issue: middleware needs to handle OPTIONS separately');
      console.error('===========================');
      
      console.error('Server-side fix example:');
      console.error(`
// Example Express.js server fix
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
  res.header('Access-Control-Allow-Credentials', 'true'); // Must be string 'true'
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  
  // Critical: Handle OPTIONS requests separately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});
      `);
    }
    throw error;
  }
};

// Handle Strava callback directly with auth data
export const handleStravaCallback = async (authData: any): Promise<boolean> => {
  try {
    console.log('=== HANDLE STRAVA CALLBACK ===');
    console.log('Auth data received:', JSON.stringify(authData, null, 2));
    
    const success = await processStravaAuthResponse(authData);
    console.log('Process auth response result:', success);
    
    // If on web, attempt to close the window after processing
    if (Platform.OS === 'web' && window.opener) {
      try {
        console.log('Attempting to communicate with parent window...');
        // Try to send message to opener before closing
        window.opener.postMessage(
          { type: 'strava-auth-complete', success, authData }, 
          '*'
        );
        console.log('Message sent to parent window');
        
        // Close the window
        console.log('Attempting to close auth window');
        window.close();
        console.log('Window close command issued');
      } catch (e) {
        console.warn('Could not communicate with parent window:', e);
      }
    }
    
    return success;
  } catch (error) {
    console.error('Error handling Strava callback:', error);
    return false;
  }
};

// Enhanced error handling for auth redirect
export const handleAuthRedirect = async (url: string): Promise<boolean> => {
  try {
    console.log('=== HANDLE AUTH REDIRECT ===');
    console.log('Handling auth redirect with URL:', url);
    
    // Extract auth data from URL
    const authData = extractAuthData(url);
    
    console.log('Extracted auth data:', authData ? JSON.stringify(authData, null, 2) : 'No data extracted');
    
    if (!authData) {
      console.error('No auth data extracted from URL');
      return false;
    }
    
    // Process the auth response
    const result = await processStravaAuthResponse(authData);
    console.log('Process auth response result:', result);
    return result;
  } catch (error) {
    console.error('Error handling auth redirect:', error);
    return false;
  }
};

// Enhanced extractAuthData with better logging
export function extractAuthData(url: string): any | null {
  try {
    console.log('=== EXTRACT AUTH DATA ===');
    console.log('Extracting data from URL:', url);
    
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    console.log('URL parameters:', Array.from(params.entries()));
    
    // For direct auth data in URL (when backend returns tokens directly)
    if (params.has('access_token')) {
      console.log('Found access_token in URL parameters');
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        expires_at: params.get('expires_at'),
        user: params.has('user') ? JSON.parse(decodeURIComponent(params.get('user') || '{}')) : null
      };
    }
    
    // For code flow (when backend returns a code that needs to be exchanged)
    if (params.has('code')) {
      console.log('Found code in URL parameters:', params.get('code'));
      return {
        code: params.get('code'),
        state: params.get('state')
      };
    }
    
    console.warn('No access_token or code found in URL parameters');
    return null;
  } catch (error) {
    console.error('Error extracting auth data:', error);
    console.error('URL that caused the error:', url);
    return null;
  }
}

// Enhanced checkAuthAfterRedirect with detailed logging
export const checkAuthAfterRedirect = async (): Promise<boolean> => {
  try {
    console.log('=== CHECK AUTH AFTER REDIRECT ===');
    
    // Try loading from storage first
    await loadAuthState();
    
    if (authState.accessToken) {
      console.log('Found existing access token after redirect');
      return true;
    } else {
      console.log('No access token found in auth state');
    }
    
    // Get session ID if available
    const sessionId = await getStorageItem('strava_auth_session');
    console.log('Using session ID for auth check:', sessionId || 'none');
    
    // Since CORS is a persistent issue, try browser storage first
    if (Platform.OS === 'web') {
      console.log('Running on web platform, checking storage options...');
      
      try {
        // 1. Try localStorage first
        if (window.localStorage) {
          console.log('Checking localStorage for auth data');
          const stravaAuthData = window.localStorage.getItem('strava_auth_data');
          
          if (stravaAuthData) {
            console.log('Found auth data in localStorage');
            try {
              const authData = JSON.parse(stravaAuthData);
              console.log('Auth data parsed successfully:', 
                authData ? (authData.access_token ? 'Has access_token' : 'Missing access_token') : 'Empty auth data');
              
              window.localStorage.removeItem('strava_auth_data');
              console.log('Removed auth data from localStorage');
              
              if (authData && authData.access_token) {
                console.log('Storing auth data from localStorage');
                return await storeAuthDataDirectly(authData);
              }
            } catch (parseError) {
              console.error('Error parsing localStorage data:', parseError);
              console.error('Raw localStorage data:', stravaAuthData);
            }
          } else {
            console.log('No auth data found in localStorage');
          }
        } else {
          console.log('localStorage not available');
        }
        
        // 2. Try sessionStorage as fallback
        if (window.sessionStorage) {
          console.log('Checking sessionStorage for auth data');
          const stravaAuthData = window.sessionStorage.getItem('strava_auth_data');
          
          if (stravaAuthData) {
            console.log('Found auth data in sessionStorage');
            try {
              const authData = JSON.parse(stravaAuthData);
              console.log('Auth data parsed successfully:', 
                authData ? (authData.access_token ? 'Has access_token' : 'Missing access_token') : 'Empty auth data');
              
              window.sessionStorage.removeItem('strava_auth_data');
              console.log('Removed auth data from sessionStorage');
              
              if (authData && authData.access_token) {
                console.log('Storing auth data from sessionStorage');
                return await storeAuthDataDirectly(authData);
              }
            } catch (parseError) {
              console.error('Error parsing sessionStorage data:', parseError);
              console.error('Raw sessionStorage data:', stravaAuthData);
            }
          } else {
            console.log('No auth data found in sessionStorage');
          }
        } else {
          console.log('sessionStorage not available');
        }
      } catch (e) {
        console.error('Error accessing storage:', e);
      }
    } else {
      console.log('Not running on web platform, skipping web storage checks');
    }
    
    // As a final fallback, check the auth status endpoint
    console.log('Checking auth status endpoint');
    const { isAuthenticated } = await checkAuthStatus(sessionId || undefined);
    
    return isAuthenticated;
  } catch (error) {
    console.error('Failed to check authentication after redirect:', error);
    return false;
  }
};

// New method to check authentication status using the consolidated endpoint
export const checkAuthStatus = async (sessionId?: string): Promise<{isAuthenticated: boolean, authData?: any}> => {
  try {
    console.log('=== CHECKING AUTH STATUS ===');
    
    // Construct URL with session ID if provided
    const url = new URL(`${API_URL}/api/auth/status`);
    if (sessionId) {
      url.searchParams.append('session_id', sessionId);
    }
    
    // Add timestamp to prevent caching
    url.searchParams.append('_t', Date.now().toString());
    
    console.log('Checking auth status at URL:', url.toString());
    
    let response;
    try {
      // Try first with regular fetch (may work better in some environments)
      response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      console.log('Auth status check response status:', response.status);
    } catch (e) {
      console.log('Regular fetch failed, trying fetchWithCORS:', e);
      // If regular fetch fails, try with our CORS helper
      response = await fetchWithCORS(url.toString(), {
        method: 'GET',
      });
    }
    
    if (!response.ok) {
      console.error('Auth status check failed with status:', response.status);
      return { isAuthenticated: false };
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Auth status check returned non-JSON response');
      return { isAuthenticated: false };
    }
    
    const data = await response.json();
    console.log('Auth status response:', data);
    
    if (data.isAuthenticated && data.access_token) {
      // Store authentication data
      const success = await storeAuthDataDirectly({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        user: data.user
      });
      
      console.log('Auth data stored successfully:', success);
      return { isAuthenticated: true, authData: data };
    }
    
    return { isAuthenticated: false };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { isAuthenticated: false };
  }
};

// Enhanced loginWithStrava with detailed debugging
export const loginWithStrava = async (): Promise<boolean> => {
  try {
    console.log('=== STARTING STRAVA LOGIN FLOW ===');
    // Get auth URL from your SolidJS API
    console.log('Getting Strava auth URL from API');
    const authUrl = await getStravaAuthUrl();
    console.log('Auth URL received successfully');
    
    // Generate a unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    await setStorageItem('strava_auth_session', sessionId);
    console.log('Generated session ID:', sessionId);
    
    // Set a flag to indicate we're in the auth process
    await setStorageItem('auth_in_progress', 'true');
    await setStorageItem('auth_start_time', Date.now().toString());
    console.log('Auth process flags set');
    
    // Clear any existing auth data in storage
    if (Platform.OS === 'web') {
      try {
        if (window.localStorage) {
          window.localStorage.removeItem('strava_auth_data');
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem('strava_auth_data');
        }
        console.log('Cleared any existing auth data from storage');
      } catch (e) {
        console.warn('Error clearing storage:', e);
      }
    }
    
    if (Platform.OS === 'web') {
      console.log('Running on web platform, using popup approach');
      // For web, use a popup approach with better handling
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      // Create popup window features
      const features = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`;
      console.log('Popup window features:', features);
      
      // Add session_id to the auth URL
      const authUrlWithSession = authUrl + (authUrl.includes('?') ? '&' : '?') + 
                                 `state=${sessionId}`;
      
      // Open auth window
      console.log('Opening auth window with URL:', authUrlWithSession.substring(0, 50) + '...');
      const authWindow = window.open(authUrlWithSession, 'StravaAuth', features);
      
      if (!authWindow) {
        console.warn('Popup blocked. Please allow popups for this site.');
        return false;
      }
      console.log('Auth window opened successfully');
      
      // Return a promise that resolves when authentication is complete
      return new Promise((resolve) => {
        console.log('Setting up polling to monitor auth window');
        // Track poll count for timeout
        let pollCount = 0;
        const maxPolls = 240; // 4 minutes max (polling every second)
        
        // Create interval to check for window closure and auth state
        const pollInterval = setInterval(async () => {
          // Every 15 seconds, log progress
          if (pollCount % 15 === 0) {
            console.log(`Still waiting for auth... (${pollCount}s elapsed)`);
          }
          
          // Periodically check auth status even before window closes
          if (pollCount % 5 === 0) { // Check every 5 seconds
            try {
              const { isAuthenticated } = await checkAuthStatus(sessionId);
              if (isAuthenticated) {
                clearInterval(pollInterval);
                console.log('Authentication confirmed via status check');
                if (!authWindow.closed) {
                  try {
                    authWindow.close();
                  } catch (e) {
                    console.warn('Could not close auth window:', e);
                  }
                }
                resolve(true);
                return;
              }
            } catch (e) {
              console.warn('Error during periodic auth check:', e);
            }
          }
          
          // Check if auth window was closed
          if (authWindow.closed) {
            clearInterval(pollInterval);
            console.log('Auth window closed, checking for authentication data');
            
            // Wait a moment for any storage operations to complete
            setTimeout(async () => {
              // First check browser storage
              let authFromStorage = false;
              
              if (Platform.OS === 'web') {
                try {
                  if (window.localStorage && window.localStorage.getItem('strava_auth_data')) {
                    const authData = JSON.parse(window.localStorage.getItem('strava_auth_data')!);
                    window.localStorage.removeItem('strava_auth_data');
                    
                    if (authData && authData.access_token) {
                      console.log('Found auth data in localStorage after window closed');
                      authFromStorage = await storeAuthDataDirectly(authData);
                    }
                  }
                } catch (e) {
                  console.warn('Error reading from localStorage:', e);
                }
              }
              
              // If no auth from storage, check status endpoint
              if (!authFromStorage) {
                console.log('Checking final auth status with session ID:', sessionId);
                const { isAuthenticated } = await checkAuthStatus(sessionId);
                if (isAuthenticated) {
                  console.log('Authentication confirmed via status check');
                  resolve(true);
                  return;
                }
              } else {
                resolve(true);
                return;
              }
              
              // Final authentication check
              console.log('Checking if auth was successful...');
              const isAuth = await isAuthenticated();
              console.log('Auth check result:', isAuth);
              
              if (isAuth) {
                console.log('Authentication successful');
                resolve(true);
              } else {
                console.log('Authentication failed or was cancelled');
                resolve(false);
              }
              
              await deleteStorageItem('auth_in_progress');
            }, 1000);
            return;
          }
          
          // Check poll count to avoid infinite polling
          if (++pollCount >= maxPolls) {
            clearInterval(pollInterval);
            console.log('Auth timed out after 4 minutes');
            await deleteStorageItem('auth_in_progress');
            resolve(false);
          }
        }, 1000);
      });
    } else {
      // For native platforms, use WebBrowser
      console.log('Running on native platform, using WebBrowser for auth');
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'stravaauth://auth-callback'
      );
      
      console.log('WebBrowser auth result type:', result.type);
      if (result.type === 'success' && result.url) {
        console.log('Got success result with URL');
        return await handleAuthRedirect(result.url);
      }
      
      console.log('No success result or URL from WebBrowser');
      return false;
    }
  } catch (error) {
    console.error('Strava login failed:', error);
    await deleteStorageItem('auth_in_progress');
    return false;
  }
};

// Enhanced storeAuthDataDirectly with better logging
export const storeAuthDataDirectly = async (authData: any): Promise<boolean> => {
  try {
    console.log('=== STORING AUTH DATA DIRECTLY ===');
    
    if (!authData) {
      console.error('Auth data is null or undefined');
      return false;
    }
    
    if (!authData.access_token) {
      console.error('Auth data missing access_token');
      console.log('Auth data keys:', Object.keys(authData));
      return false;
    }
    
    console.log('Access token present:', authData.access_token.substring(0, 10) + '...');
    console.log('Refresh token present:', !!authData.refresh_token);
    
    // Calculate expires_at if not provided
    const expiresAt = authData.expires_at 
      ? Number(authData.expires_at) * 1000 // Convert to milliseconds if it's in seconds
      : (Date.now() + 6 * 60 * 60 * 1000); // Default 6 hours
      
    console.log('Token expiry:', new Date(expiresAt).toISOString());
    
    // Extract user data from various possible sources
    const userData = authData.user || authData.athlete || null;
    console.log('User data present:', !!userData);
    if (userData) {
      console.log('User data fields:', Object.keys(userData));
    }
    
    // Store auth data directly
    console.log('Saving auth state to storage');
    await saveAuthState({
      accessToken: authData.access_token,
      refreshToken: authData.refresh_token || null,
      expiresAt: expiresAt,
      user: userData,
    });
    
    console.log('Auth state saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to store auth data directly:', error);
    console.error('Auth data that caused the error:', authData ? JSON.stringify(authData, null, 2) : 'null');
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
// Process Strava auth response and store tokens
export const processStravaAuthResponse = async (authData: any): Promise<boolean> => {
  try {
    console.log('=== PROCESSING STRAVA AUTH RESPONSE ===');
    
    // If we received direct auth data with tokens
    if (authData.access_token) {
      console.log('Direct auth data received, storing tokens');
      return await storeAuthDataDirectly(authData);
    }
    
    // If we received an auth code that needs to be exchanged
    if (authData.code) {
      console.log('Auth code received, exchanging for tokens');
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
      console.log('Token exchange successful');
      return await storeAuthDataDirectly(tokenData);
    }

    console.error('Invalid auth data received:', authData);
    return false;
  } catch (error) {
    console.error('Error processing Strava auth response:', error);
    return false;
  }
};
