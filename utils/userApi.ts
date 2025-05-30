import axios from 'axios';

/**
 * Updates a user profile by sending data to the update endpoint
 * @param userData User data to update
 * @returns The updated user data
 */
export async function updateUserProfile(userData: {
  stravaId: string | number;
  email?: string;
  firstName?: string;
  lastName?: string; 
  imageUrl?: string;
  isAdmin?: boolean;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  teamId?: number;
}) {
  try {
    // Convert the userData object to JSON
    const response = await axios.post(
      'http://localhost:3000/api/user/update',
      JSON.stringify(userData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Include any authentication headers if needed
          // 'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data.user;
    } else {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
