/**
 * Common interfaces for data models used across the application
 */

/**
 * User interface representing a user in the system
 */
export interface User {
  stravaId: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  teamId?: number;
  imageUrl?: string;
  isAdmin?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface TopUser {
  stravaId: string;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  teamId?: number;
  imageUrl?: string;
  isAdmin?: boolean;
    _count?: {
    activities: number;
  };// Number of activities
  accessToken?: string | null;
  refreshToken?: string | null;
}

/**
 * UserSession interface representing the current logged-in user
 */
export interface UserSession extends User {
  id: string | number;  // Session ID or user ID
  token?: string;       // Auth token
  expiresAt?: number;   // Token expiration timestamp
}

/**
 * Team interface representing a group of users
 */
export interface Team {
  id: number;
  name: string;
  users: User[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ActivityUser represents a simplified user reference within an activity
 */
export interface ActivityUser {
  stravaId: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

/**
 * Activity interface representing a sports or training activity
 */
export interface Activity {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  distance: number;        // in meters
  movingTime: number;      // in seconds
  elevationGain?: number;  // in meters
  type?: string;           // e.g., "Run", "Ride", "Swim"
  imageUrl: string[] | null;
  users: ActivityUser[];
  createdAt?: string;
  updatedAt?: string;
  stravaActivityId?: number;
}

/**
 * ActivityFormData interface representing data used in activity creation form
 */
export interface ActivityFormData {
  title: string;
  description: string;
  date: Date;
  participants: User[];
  stravaActivity: StravaActivity | null;
}

/**
 * StravaActivity interface representing an activity fetched from Strava API
 */
export interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time?: number;
  elevation_gain?: number;
  start_date: string;
  map?: {
    summary_polyline?: string;
  };
  thumbnail?: string;
}

/**
 * ApiResponse interface for common API response structure
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}
