/**
 * CORS Handler utility for API requests
 * Provides consistent CORS handling across the application
 */

/**
 * Creates headers and options for fetch requests with proper CORS handling
 */
export const createCorsHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

/**
 * Fetches data from a URL with CORS handling.
 * @template T The expected response type
 * @param {string} url - The URL to fetch data from
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<T>} - The response data
 */
export async function fetchWithCors<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error('Error in fetchWithCors:', error);
    throw error;
  }
}
