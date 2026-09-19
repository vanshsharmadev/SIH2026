import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

/**
 * Resolves the backend base URL dynamically from environment variables.
 * Supports:
 * - VITE_BACKEND_URL
 * - BACKEND_URL
 * - VITE_API_URL
 * - VITE_API_BASE_URL
 *
 * Automatically normalizes trailing slashes and ensures the '/api' route prefix is present.
 */
export const getBaseURL = () => {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '';

  if (!envUrl || typeof envUrl !== 'string' || !envUrl.trim()) {
    // Default fallback for local development (Spring Boot standard port 8080 or Node 5000)
    return 'http://localhost:8080/api';
  }

  let cleanUrl = envUrl.trim().replace(/\/+$/, '');

  // If URL doesn't end with /api, append /api so endpoints match backend controllers
  if (!cleanUrl.toLowerCase().endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }

  return cleanUrl;
};

export const BASE_URL = getBaseURL();

// Create Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout (ideal for cold starts on Render / Railway)
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Token and handle FormData automatically
api.interceptors.request.use(
  (config) => {
    // Update baseURL dynamically in case env changed or was reloaded
    config.baseURL = getBaseURL();

    // Attach JWT Token if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    // When uploading FormData (files), let browser automatically set boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamless data unwrapping & human-friendly error messages
api.interceptors.response.use(
  (response) => {
    // Return the response payload directly
    return response.data;
  },
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.';

    const isLoginReq = error.config?.url?.includes('/login');

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      friendlyMessage = 'Server request timed out. The backend server might be starting up, please try again.';
    } else if (!error.response) {
      // Network error or CORS issue
      friendlyMessage =
        'Unable to connect to the backend server. Please verify your internet connection or check the deployed BACKEND_URL in .env.';
    } else if (error.response?.status === 401) {
      if (isLoginReq) {
        friendlyMessage =
          error.response?.data?.message || 'Invalid email or password. Please check your credentials.';
      } else {
        friendlyMessage =
          'Authentication required or session expired. Please sign in to perform this action.';
        try {
          const token = localStorage.getItem('token');
          // Only clear if it was an actual expired backend token, avoid disrupting demo sessions
          if (token && !token.startsWith('gem-token-')) {
            store.dispatch(logout());
          }
        } catch {
          // ignore
        }
      }
    } else if (error.response?.status === 403) {
      friendlyMessage = error.response?.data?.message || 'Access denied or unverified account.';
    } else if (error.response?.status === 409) {
      friendlyMessage =
        error.response?.data?.message ||
        'An account with this email, GSTIN, or identity is already registered. Please sign in instead.';
    } else if (error.response?.status === 404) {
      friendlyMessage = error.response?.data?.message || 'Requested resource was not found on the server.';
    } else if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
      const firstError = Object.values(error.response.data.errors)[0];
      friendlyMessage = firstError || error.response.data.message || 'Validation error. Please check your inputs.';
    } else if (error.response?.data?.message) {
      friendlyMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      friendlyMessage = error.response.data.error;
    } else if (error.response?.status >= 500) {
      friendlyMessage = 'Internal server error. Please try again later.';
    }

    const customError = new Error(friendlyMessage);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    customError.raw = error;

    return Promise.reject(customError);
  }
);

/**
 * Health check helper to verify if the deployed backend is reachable
 */
export const checkBackendHealth = async () => {
  try {
    const rawBase = getBaseURL().replace(/\/api$/, '');
    const response = await axios.get(`${rawBase}/actuator/health`, { timeout: 8000 }).catch(() => null);
    if (response && response.status === 200) return true;

    // Alternative ping to API root
    const apiPing = await axios.get(getBaseURL(), { timeout: 8000 }).catch((err) => err.response);
    return !!(apiPing && apiPing.status < 500);
  } catch {
    return false;
  }
};

/**
 * Check if a custom backend URL is currently configured in environment
 */
export const isCustomBackendConfigured = () => {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '';
  return Boolean(envUrl && envUrl.trim());
};

export default api;
