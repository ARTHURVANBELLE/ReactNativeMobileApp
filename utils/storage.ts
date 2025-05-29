import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Stores a value securely in platform-appropriate storage
 * Uses SecureStore on native platforms and localStorage on web
 */
export const setStorageItem = async (key: string, value: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
    return false;
  }
};

/**
 * Retrieves a value from secure storage based on platform
 */
export const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
};

/**
 * Deletes a value from secure storage
 */
export const deleteStorageItem = async (key: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting storage item ${key}:`, error);
    return false;
  }
};

/**
 * Checks if a value exists in storage
 */
export const hasStorageItem = async (key: string): Promise<boolean> => {
  try {
    const value = await getStorageItem(key);
    return value !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Clears all storage items (use with caution)
 */
export const clearStorage = async (): Promise<boolean> => {
  try {
    const keysToDelete = [
      'strava_access_token',
      'strava_refresh_token',
      'strava_token_expiry',
      'user_data'
    ];
    
    if (Platform.OS === 'web') {
      keysToDelete.forEach(key => localStorage.removeItem(key));
    } else {
      // SecureStore doesn't have a clear method
      await Promise.all(keysToDelete.map(key => SecureStore.deleteItemAsync(key)));
    }
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};
