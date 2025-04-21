
import axios, { AxiosError, isAxiosError } from 'axios';

// Create axios instance with dynamic base URL that works for all environments
const getBaseURL = () => {
  // For cloud environments, use the same host but with different protocol and port if needed
  const isProduction = import.meta.env.PROD;
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    return apiUrl; // Use explicit API URL if provided in environment
  }
  
  if (isProduction) {
    // In production, use relative URL which works regardless of domain
    return '/api';
  }

  // Get the current host from the window location
  const currentHost = window.location.hostname;
  
  // For local development, try to use the saved port or default to 5000
  const savedPort = sessionStorage.getItem('apiPort') || '5000';
  
  // If we're on localhost, use localhost
  // If we're accessing from a different IP, use that same IP for the API
  // This ensures the API calls go to the same machine that served the frontend
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return `http://localhost:${savedPort}/api`;
  } else {
    // For access from other devices or IPs, use the same hostname
    return `http://${currentHost}:${savedPort}/api`;
  }
};

const baseURL = getBaseURL();

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/authentication
});

// Add request interceptor to handle auth token from localStorage if needed
api.interceptors.request.use(
  (config) => {
    // console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Only save port in local development and in session storage (not localStorage)
    if (!import.meta.env.PROD && response.config.baseURL) {
      const match = response.config.baseURL.match(/localhost:(\d+)/);
      if (match && match[1]) {
        const currentPort = sessionStorage.getItem('apiPort');
        if (currentPort !== match[1]) {
          sessionStorage.setItem('apiPort', match[1]);
          // console.log(`Updated saved API port to: ${match[1]}`);
        }
      }
    }
    
    // console.log(`API Response: ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // Handle common errors here
    // console.error('API request error:', error);
    
    // Only attempt port discovery in local development
    if (!import.meta.env.PROD && error.code === 'ERR_NETWORK') {
      // console.error(`Network error - Cannot reach API`);
      
      // Only try alternate ports in local development
      if (window.location.hostname === 'localhost') {
        const tryAlternatePort = async () => {
          // console.log("Attempting to find working API port...");
          // Start from port 5000 and try a wider range
          for (let port = 5000; port <= 5020; port++) {
            try {
              const altBaseURL = `http://localhost:${port}/api`;
              // console.log(`Trying alternate port: ${port}`);
              
              // Test if this port works
              const response = await fetch(`${altBaseURL}/health`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (response.ok) {
                // console.log(`Found working API at port ${port}`);
                sessionStorage.setItem('apiPort', port.toString());
                
                // Update the baseURL for future requests instead of reloading
                api.defaults.baseURL = altBaseURL;
                // console.log(`Switched to port ${port}`);
                
                // Return true to indicate we found a working port
                return true;
              }
            } catch (e) {
              // Continue to next port
              // console.log(`Port ${port} not available or not responding`);
            }
          }
          // console.error('Could not find a working API port in range 5000-5020');
          return false;
        };
        
        // Add small delay before trying alternate ports
        setTimeout(() => {
          tryAlternatePort().then(found => {
            if (!found) {
              // Clear the saved port if we couldn't find a working port
              sessionStorage.removeItem('apiPort');
            }
          });
        }, 500);
      }
    }
    
    if (isAxiosError(error) && error.response) {
      // console.error(`API Error ${error.response.status} from ${error.config?.url}:`, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Log the base URL during initialization to help with debugging
// console.log(`API Client initialized with base URL: ${api.defaults.baseURL}`);

// Export additional utilities
export { isAxiosError };
export default api;
