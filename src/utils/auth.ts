import axios from 'axios';
import { BASE_PATH_FRONT_END, BASE_URL, OTP_VERIFICATION_URL, ENABLE_FERNET } from './constants';
import { clearIndexedDB, getLocalStorage, removeLocalStorage, storeLocalStorage, decodeFernetToken } from './helper';
import { store } from '@/redux/store';

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
      console.log('🔑 [auth.ts] Token injected in request interceptor:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ [auth.ts] No token available for request to:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

const refreshAuthToken = async (): Promise<string> => {
  const refreshToken = getLocalStorage('refreshToken');
  const userId = getLocalStorage('userId');
  const userType = getLocalStorage('userType');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshData = `<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"Refresh"</J_Ui>
    <Sql/>
    <X_Filter></X_Filter>
    <X_Data>
        <RefreshToken>${refreshToken}</RefreshToken>
    </X_Data>
    <J_Api>"UserId":"${userId}", "UserType":"${userType}"</J_Api>
</dsXml>`;

  console.log('Attempting to refresh token...');

  try {
    // Create a new axios instance to bypass interceptors for refresh token requests
    const refreshAxios = axios.create();

    const response = await refreshAxios.post(
      BASE_URL + OTP_VERIFICATION_URL,
      refreshData,
      {
        headers: {
          'Content-Type': 'application/xml'
        },
        timeout: 30000
      }
    );

    console.log('Refresh token API response:', response.status, response.data);

    // Check both ENABLE_FERNET constant and encPayload from Redux state
    const shouldDecode = ENABLE_FERNET && store.getState().common.encPayload;
    const data = shouldDecode ? decodeFernetToken(response.data.data) : response.data;

    console.log('Refresh token decoded data:', data);

    if (data.success && data.data.rs0.length > 0) {
      const tokenData = data.data.rs0[0];

      // Update tokens in localStorage using the helper functions
      storeLocalStorage('auth_token', tokenData.AccessToken);
      storeLocalStorage('refreshToken', tokenData.RefreshToken);
      console.log('✅ [auth.ts] Tokens refreshed successfully');
      console.log('🔑 [auth.ts] New access token:', tokenData.AccessToken.substring(0, 20) + '...');
      console.log('🔄 [auth.ts] New refresh token:', tokenData.RefreshToken.substring(0, 20) + '...');

      return tokenData.AccessToken;
    } else {
      console.error('Refresh token API returned unsuccessful response:', data);
      throw new Error('Failed to refresh token');
    }
  } catch (error: any) {
    console.error('Token refresh failed:', error);

    // If refresh token API itself returns 401, immediately logout the user
    if (error.response?.status === 401) {
      console.warn('Refresh token is invalid or expired (401). Logging out user.');
      logout();
      throw new Error('Refresh token expired - user logged out');
    }

    throw error;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // The request interceptor will automatically inject the fresh token
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        processQueue(null);

        // The request interceptor will automatically inject the fresh token
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Only logout if refresh fails
        logout();
        window.location.href = `${BASE_PATH_FRONT_END}/signin`;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

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