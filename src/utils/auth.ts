import axios from 'axios';

// Create axios instance with default config
export const api = axios.create({
  baseURL: 'https://trade-plus.in/TradeWebAPI/api',
});

// Add request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      logout();
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export const logout = () => {
  // Clear cookies
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  
  // Clear all localStorage data
  localStorage.clear();
  
  // Redirect to login page
  window.location.href = '/signin';
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  // Check if token is expired
  const expireTime = localStorage.getItem('tokenExpireTime');
  if (expireTime && new Date(expireTime) < new Date()) {
    logout();
    return false;
  }

  return true;
};

export const getAuthToken = () => {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
  return authCookie ? authCookie.split('=')[1] : null;
};

export const getUserData = () => {
  return {
    clientCode: localStorage.getItem('clientCode'),
    clientName: localStorage.getItem('clientName'),
    userType: localStorage.getItem('userType'),
  };
};
