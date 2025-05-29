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
 * Wraps fetch with CORS handling
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export const fetchWithCors = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: createCorsHeaders(),
    // Don't include credentials by default as it requires special server configuration
    // credentials: 'include',
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    console.log(`Fetching ${url} with options:`, mergedOptions);
    console.log(`COOOOOOOOOOOOOOOOOOOOOOOOORS --------------`);
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
