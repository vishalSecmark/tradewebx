import axios from 'axios';
import { APP_METADATA_KEY, BASE_PATH_FRONT_END, BASE_URL } from './constants';
import { clearIndexedDB, clearLocalStorage, getLocalStorage, removeLocalStorage } from './helper';

// Create axios instance with default config
export const api = axios.create({
  baseURL: BASE_URL + '/TradeWebAPI/api',
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

// // Add response interceptor to handle token expiration
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Token expired or invalid
//       logout();
//       window.location.href = `${BASE_PATH_FRONT_END}/signin`;
//     }
//     return Promise.reject(error);
//   }
// );

export const logout = () => {
  // Clear all authentication data
  clearAllAuthData();
  sessionStorage.clear();
  // Redirect to login page - Next.js basePath config handles the base path automatically
  window.location.href = `${BASE_PATH_FRONT_END}/signin`;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  // Check if token is expired
  // const expireTime = localStorage.getItem('tokenExpireTime');
  // if (expireTime && new Date(expireTime) < new Date()) {
  //   logout();
  //   clearIndexedDB();
  //   return false;
  // }

  return true;
};

export const getAuthToken = () => {
  return getLocalStorage('auth_token');
};

export const getUserData = () => {
  return {
    clientCode: getLocalStorage('clientCode'),
    clientName: getLocalStorage('clientName'),
    userType: getLocalStorage('userType'),
  };
};

export const clearAuthStorage = () => {
  removeLocalStorage('userId');
  removeLocalStorage('temp_token');
  removeLocalStorage('tokenExpireTime');
  removeLocalStorage('clientCode');
  removeLocalStorage('clientName');
  removeLocalStorage('userType');
  removeLocalStorage('loginType');

  // ekyc related states 
  removeLocalStorage('ekyc_dynamicData');
  removeLocalStorage('ekyc_activeTab');
  removeLocalStorage('redirectedField');
  removeLocalStorage('ekyc_submit');
  removeLocalStorage('ekyc_viewMode');
  removeLocalStorage("ekyc_viewMode_for_checker");
  removeLocalStorage('ekyc_checker');
  removeLocalStorage('ekyc_submit');
  removeLocalStorage('ekyc_viewMode');
  removeLocalStorage("ekyc_viewMode_for_checker");
  removeLocalStorage('ekyc_checker');
  clearIndexedDB();
};

// Comprehensive function to clear all authentication data
export const clearAllAuthData = () => {
  if (typeof window !== 'undefined') {
    // Clear all authentication-related localStorage items
    removeLocalStorage('userId');
    removeLocalStorage('auth_token');
    removeLocalStorage('refreshToken');
    removeLocalStorage('tokenExpireTime');
    removeLocalStorage('clientCode');
    removeLocalStorage('clientName');
    removeLocalStorage('userType');
    removeLocalStorage('loginType');
    removeLocalStorage('temp_token');

    // Clear ekyc related states
    removeLocalStorage('ekyc_dynamicData');
    removeLocalStorage('ekyc_activeTab');
    removeLocalStorage('redirectedField');
    removeLocalStorage('ekyc_submit');
    removeLocalStorage('ekyc_viewMode');
    removeLocalStorage('ekyc_viewMode_for_checker');
    removeLocalStorage('ekyc_checker');

    // Clear any other auth-related items
    removeLocalStorage('auth_token_integrity');
    removeLocalStorage('login_attempts');
    removeLocalStorage('KRAredirectedField');

    // Clear IndexedDB
    clearIndexedDB();

    console.log('All authentication data cleared successfully');
  }
};