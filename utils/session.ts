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

// Start Strava OAuth flow
export const loginWithStrava = async (): Promise<boolean> => {
  try {
    // Get auth URL from your SolidJS API
    const authUrl = await getStravaAuthUrl();
    
    // Important: For WebBrowser.openAuthSessionAsync, we need a URL that the WebBrowser
    // should redirect back to after authentication
    let returnUrl;
    
    if (Platform.OS === 'web') {
      // For web, we want to return to our app's main page or auth completion page
      returnUrl = `${window.location.origin}/auth-complete`;
    } else {
      // For native, use your app's deep link scheme
      returnUrl = 'your-app-scheme://auth-complete';
    }
    
    console.log('Starting auth session with return URL:', returnUrl);
    
    // Open browser for authentication
    const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
    
    // Handle the result based on platform
    if (Platform.OS === 'web') {
      // On web, we might get redirected back to our app automatically
      // Check if we have tokens in session/cookies already
      return await isAuthenticated(); // Check if we're now authenticated
    } else {
      // On native, parse the result URL for the auth code or tokens
      if (result.type === 'success' && result.url) {
        // The URL might contain auth info or we may need to make another request
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
    
    console.log('Exchanging code for tokens...');
    
    // Exchange code for tokens via your SolidJS API with CORS handling
    const response = await fetchWithCORS(`${API_URL}/api/auth/strava/callback`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    
    // Similar error handling as above
    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;
      const responseText = await response.text();
      console.error('Error response:', status, statusText);
      console.error('Response body:', responseText.substring(0, 200) + '...');
      throw new Error(`Token exchange failed: ${status} ${statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Received non-JSON response:', text.substring(0, 200) + '...');
      throw new Error('Server did not return JSON');
    }
    
    const data = await response.json();
    
    console.log('Token exchange successful');
    
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
