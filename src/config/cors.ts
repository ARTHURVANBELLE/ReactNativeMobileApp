import { Platform } from 'react-native';

// Parse environment variables for CORS configuration
const allowedOrigins = process.env.REACT_APP_CORS_ORIGIN 
  ? process.env.REACT_APP_CORS_ORIGIN.split(',') 
  : ['http://localhost:3000', 'http://localhost:8081'];

const allowedMethods = process.env.REACT_APP_CORS_METHODS
  ? process.env.REACT_APP_CORS_METHODS.split(',')
  : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

// Export CORS configuration object
interface CorsCallback {
  (error: Error | null, success: boolean): void;
}

interface CorsOriginFn {
  (origin: string | undefined, callback: CorsCallback): void;
}

interface CorsConfig {
  origin: CorsOriginFn;
  methods: string[];
  credentials: boolean;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

const corsConfig: CorsConfig = {
  origin: (origin: string | undefined, callback: CorsCallback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: allowedMethods,
  credentials: process.env.REACT_APP_CORS_CREDENTIALS === 'true',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export default corsConfig;
