import { QueryClient } from '@tanstack/react-query';
import { fetchWithCors } from './corsHandler';

/**
 * Creates a configured QueryClient instance with default options
 * including CORS handling for all queries
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        retryDelay: 1000,
        // We don't set suspense: true by default to allow components to decide
      },
      mutations: {
        retry: 1,
      },
    },
  });
};

// Pre-configured instance for immediate use
export const queryClient = createQueryClient();

/**
 * Creates a fetch function with CORS handling for use in React Query
 * @param url - The URL to fetch
 * @param options - Additional fetch options
 */
export const createQueryFetcher = (url: string, options: RequestInit = {}) => {
  return async () => {
    const response = await fetchWithCors(url, options);
    return response.json();
  };
};
