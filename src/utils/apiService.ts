import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Types for API responses
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// API Service Class
class ApiService {
    private defaultTimeout: number = 50000;

    // Get authorization token from localStorage
    private getAuthToken(): string | null {
        const authToken = localStorage.getItem('auth_token');
        return authToken;
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
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('userId');
        }
    }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService; 