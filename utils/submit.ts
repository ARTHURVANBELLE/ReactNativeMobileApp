import Constants from "expo-constants";
import { Alert } from "react-native";
import { fetchWithCors } from "./corsHandler";

const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;

/**
 * Interface for activity form data
 */
interface ActivityFormData {
  id: number;
  title: string;
  date: string | Date;
  movingTime: number;
  distance: number;
  delegueId: number;
  description: string | null;
  gpxUrl: string | null;
  imageUrl: string[];
  users: { userId: number }[];
}

/**
 * Response from the API after submitting form
 */
interface SubmitResponse {
  success: boolean;
  message?: string;
  activityId?: string;
  error?: string;
}

/**
 * Submit activity form data to the API
 * 
 * @param formData The activity form data to submit
 * @returns Promise resolving to the API response
 */
export const submitActivityForm = async (formData: ActivityFormData): Promise<SubmitResponse> => {
  try {
    // Log the form data being submitted (for debugging)
    console.log('Submitting activity form data:', JSON.stringify(formData, null, 2));
    
    // Format the data as needed for the API
    const apiData = {
      ...formData,
      // Convert Date object to ISO string for API
      date: formData.date instanceof Date ? formData.date.toISOString() : formData.date,
    };
    
    // Make the API request using fetchWithCors
    const response = await fetchWithCors(`${API_URL}/api/activities/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
    
    // Handle the response from fetchWithCors which might be directly the data
    if (response && typeof response === 'object') {
      if ('ok' in response && !response.ok) {
        // It's a Response object
        const responseData = await response;
        console.error('API error:', responseData);
        throw new Error((responseData as { error?: string }).error || 'Failed to create activity');
      }
      
      // Might already be parsed JSON from fetchWithCors
      return response as SubmitResponse;
    }
    
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error submitting activity form:', error);
    
    // Re-throw the error with a friendly message
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while creating the activity'
    );
  }
};

/**
 * Submit activity form data with error handling and alerts
 * 
 * @param formData The activity form data to submit
 * @param onSuccess Optional callback function to run on successful submission
 * @returns Promise resolving to a boolean indicating success or failure
 */
export const submitActivityFormWithErrorHandling = async (
  formData: ActivityFormData,
  onSuccess?: (activityId: string) => void
): Promise<boolean> => {
  try {
    const result = await submitActivityForm(formData);
    
    if (result.success) {
      Alert.alert('Success', 'Activity created successfully!');
      
      if (onSuccess && result.activityId) {
        onSuccess(result.activityId);
      }
      
      return true;
    } else {
      Alert.alert('Error', result.message || 'Failed to create activity');
      return false;
    }
  } catch (error) {
    Alert.alert(
      'Error',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
    return false;
  }
};
