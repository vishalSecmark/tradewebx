import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { BASE_PATH_FRONT_END, BASE_URL, OTP_VERIFICATION_URL } from './constants';
import { toast } from 'react-toastify';

// Router instance for navigation
let routerInstance: any = null;

// Types for API responses
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Types for refresh token response
interface RefreshTokenResponse {
    success: boolean;
    data: {
        rs0: Array<{
            AccessToken: string;
            RefreshToken: string;
        }>;
    };
}

// API Service Class
class ApiService {
    private defaultTimeout: number = 50000;
    private isRefreshing: boolean = false;
    private failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (error?: any) => void;
    }> = [];

    constructor() {
        this.setupInterceptors();
    }

    // Set router instance for navigation
    setRouter(router: any): void {
        routerInstance = router;
    }

    // Setup axios interceptors for automatic token refresh
    private setupInterceptors(): void {
        // Response interceptor to handle 401 errors
        axios.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // If already refreshing, queue the request
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        }).then(() => {
                            return axios(originalRequest);
                        }).catch(err => {
                            return Promise.reject(err);
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        await this.refreshAuthToken();
                        this.processQueue(null);

                        // Update the authorization header with new token
                        const newToken = this.getAuthToken();
                        if (newToken && originalRequest.headers) {
                            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        }

                        return axios(originalRequest);
                    } catch (refreshError) {
                        this.processQueue(refreshError);
                        this.handleRefreshFailure();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Process queued requests after token refresh
    private processQueue(error: any): void {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });

        this.failedQueue = [];
    }

    // Handle refresh token failure
    private handleRefreshFailure(): void {
        console.log('handleRefreshFailure');
        this.clearAuth();
        toast.error("Session expired");

        // Use Next.js router for client-side navigation if available
        if (routerInstance) {
            routerInstance.push('/' + BASE_PATH_FRONT_END);
        } else if (typeof window !== 'undefined') {
            // Fallback to window.location.href if router is not set
            window.location.href = '/' + BASE_PATH_FRONT_END;
        }
    }

    // Get authorization token from localStorage
    private getAuthToken(): string | null {
        const authToken = localStorage.getItem('auth_token');
        return authToken;
    }

    // Get refresh token from localStorage
    private getRefreshToken(): string | null {
        const refreshToken = localStorage.getItem('refreshToken');
        return refreshToken;
    }

    // Refresh authentication token
    private async refreshAuthToken(): Promise<void> {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            console.log('No refresh token available');
            throw new Error('No refresh token available');
        }

        const refreshData = `<dsXml>
    <J_Ui>"ActionName":"TradeWeb","Option":"Refresh"</J_Ui>
    <Sql/>
    <X_Filter></X_Filter>
    <X_Data>
        <RefreshToken>${refreshToken}</RefreshToken>
    </X_Data>
    <J_Api>"UserId":"${localStorage.getItem('userId')}", "UserType":"${localStorage.getItem('userType')}"</J_Api>
</dsXml>`;

        console.log('Attempting to refresh token...');

        try {
            // Create a new axios instance to bypass interceptors for refresh token requests
            const refreshAxios = axios.create();

            const response = await refreshAxios.post<RefreshTokenResponse>(
                BASE_URL + OTP_VERIFICATION_URL,
                refreshData,
                {
                    headers: {
                        'Content-Type': 'application/xml'
                    },
                    timeout: this.defaultTimeout
                }
            );

            console.log('Refresh token API response:', response.status, response.data);

            if (response.data.success && response.data.data.rs0.length > 0) {
                const tokenData = response.data.data.rs0[0];

                // Update tokens in localStorage
                localStorage.setItem('auth_token', tokenData.AccessToken);
                localStorage.setItem('refreshToken', tokenData.RefreshToken);
                console.log('Tokens refreshed successfully');
            } else {
                console.error('Refresh token API returned unsuccessful response:', response.data);
                throw new Error('Failed to refresh token');
            }
        } catch (error: any) {
            console.error('Token refresh failed:', error);
            console.log('Error status:', error.response?.status);
            console.log('Error data:', error.response?.data);

            // If refresh token API itself returns 401, immediately logout the user
            if (error.response?.status === 401) {
                console.warn('Refresh token is invalid or expired (401). Logging out user.');
                this.handleRefreshFailure();
                throw new Error('Refresh token expired - user logged out');
            }

            throw error;
        }
    }

    // Create default headers with authorization
    private getDefaultHeaders(contentType: string = 'application/xml'): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': contentType
        };

        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Generic API call method
    async makeRequest<T>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const requestConfig: AxiosRequestConfig = {
                method,
                url,
                timeout: this.defaultTimeout,
                headers: this.getDefaultHeaders(config?.headers?.['Content-Type'] || 'application/xml'),
                ...config
            };

            if (data) {
                requestConfig.data = data;
            }

            const response: AxiosResponse<T> = await axios(requestConfig);

            return {
                success: true,
                data: response.data,
                message: 'Request successful'
            };
        } catch (error: any) {
            console.error('API Error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'An error occurred',
                message: 'Request failed'
            };
        }
    }

    // POST request with custom URL
    async postWithAuth(url: string, data: any, config?: AxiosRequestConfig): Promise<ApiResponse> {
        return this.makeRequest('POST', url, data, config);
    }

    // Generic GET request
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.makeRequest('GET', url, undefined, config);
    }

    // Generic POST request
    async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.makeRequest('POST', url, data, config);
    }

    // Generic PUT request
    async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.makeRequest('PUT', url, data, config);
    }

    // Generic DELETE request
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        return this.makeRequest('DELETE', url, undefined, config);
    }

    // Upload file
    async uploadFile(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('file', file);

        if (additionalData) {
            Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, String(value));
            });
        }

        return this.makeRequest('POST', url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    // Check token validity
    isTokenValid(): boolean {
        const token = this.getAuthToken();
        return !!token;
    }

    // Clear authentication
    clearAuth(): void {
        if (typeof document !== 'undefined') {
            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refreshToken');


        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userId');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refreshToken');
        }
    }
}

// Create and export singleton instance
const apiService = new ApiService();

// Helper function to set up router for the API service
// Usage: import { useRouter } from 'next/navigation'; setupApiRouter(useRouter());
export const setupApiRouter = (router: any): void => {
    apiService.setRouter(router);
};

export default apiService; 