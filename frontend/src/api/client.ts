import axios from 'axios';

/**
 * Global Axios API Client Instance
 * Configures the base URL and standard header options.
 */
const client = axios.create({
  // Loads API base URL from Vite environment config, fallback to default port 5000
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});



/**
 * Request Interceptor
 * Automatically injects the JWT authentication token into HTTP request headers
 * before the request is sent from the browser.
 */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Standard Authorization header with Bearer token schema
    config.headers.Authorization = `Bearer ${token}`;
  }
  const actingStoreId = localStorage.getItem('actingStoreId');
  if (actingStoreId) {
    config.headers['x-act-as-store-id'] = actingStoreId;
  }
  return config;
});

/**
 * Response Interceptor
 * 1. Unboxes the server response (directly returning the `response.data` object).
 * 2. Intercepts authorization errors (HTTP 401 Unauthorized), clears invalid/expired tokens,
 *    and redirects the client to the login screen.
 */
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If auth validation fails on server, clear the token and force login redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Return standard reject promise with detailed server error message or a general network error fallback
    return Promise.reject(error.response?.data || { message: 'Network error' });
  }
);

export default client;
