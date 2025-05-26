import Constants from 'expo-constants';
import { isAuthenticated, refreshAccessToken, logout } from './session';
import { getStorageItem } from './storage';

// Your SolidJS API base URL
const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST || 'https://your-api-url.com';

// Default request options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Makes an authenticated API request to your SolidJS backend
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Check authentication status and refresh token if needed
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      throw new Error('Not authenticated');
    }
    
    // Get current access token
    const accessToken = await getStorageItem('strava_access_token');
    
    // Merge options and add authorization header
    const requestOptions: RequestInit = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    };
    
    // Make the API request
    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    
    // Handle 401 Unauthorized by trying to refresh the token once
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // Retry request with new token
        const newToken = await getStorageItem('strava_access_token');
        const retryOptions = {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        
        const retryResponse = await fetch(`${API_URL}${endpoint}`, retryOptions);
        
        if (!retryResponse.ok) {
          throw new Error(`API request failed: ${retryResponse.status}`);
        }
        
        return await retryResponse.json();
      } else {
        // If refresh fails, logout and throw error
        await logout();
        throw new Error('Session expired and refresh failed');
      }
    }
    
    // Handle other errors
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Example API functions using the apiRequest utility
 */

// Get user profile
export const getUserProfile = async () => {
  return apiRequest<any>('/user/profile');
};

// Get user activities
export const getUserActivities = async (page = 1, perPage = 10) => {
  return apiRequest<any[]>(`/activities?page=${page}&per_page=${perPage}`);
};

// Create a new activity
export const createActivity = async (activityData: any) => {
  return apiRequest<any>('/activities', {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
};

// Update an activity
export const updateActivity = async (id: string, activityData: any) => {
  return apiRequest<any>(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activityData),
  });
};

// Delete an activity
export const deleteActivity = async (id: string) => {
  return apiRequest<void>(`/activities/${id}`, { method: 'DELETE' });
};
