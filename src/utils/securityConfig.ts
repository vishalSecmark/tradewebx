// Security Configuration
// This file centralizes all security settings for easy management

export const SECURITY_CONFIG = {
    // Request signature key for API security
    REQUEST_SIGNATURE_KEY: 'TradeWebX_Security_Key_2024',

    // Token validation endpoint
    TOKEN_VALIDATION_ENDPOINT: '/api/auth/validate-token',

    // Request timeout in milliseconds
    REQUEST_TIMEOUT: 30000,

    // Maximum retry attempts for failed requests
    MAX_RETRY_ATTEMPTS: 3,

    // Force HTTPS in production
    FORCE_HTTPS: process.env.NODE_ENV === 'production',

    // Allowed hosts that can run without HTTPS (for development and testing)
    ALLOWED_HTTP_HOSTS: [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        // Add your testing URLs here
        'test.yourdomain.com',
        'staging.yourdomain.com',
        'dev.yourdomain.com',
        // Allow any subdomain of yourdomain.com for testing
        '.yourdomain.com',
        // Add more testing domains as needed
        'test.local',
        'dev.local',
        'staging.local'
    ],

    // Rate limiting configuration
    RATE_LIMITING: {
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
        API_RATE_LIMIT: 100, // requests per minute
    },

    // Security headers configuration
    SECURITY_HEADERS: {
        CSP_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
        HSTS_MAX_AGE: '31536000', // 1 year
        X_FRAME_OPTIONS: 'DENY',
        X_CONTENT_TYPE_OPTIONS: 'nosniff',
        X_XSS_PROTECTION: '1; mode=block',
        REFERRER_POLICY: 'strict-origin-when-cross-origin',
    },

    // Token validation cache duration (5 minutes)
    TOKEN_CACHE_DURATION: 5 * 60 * 1000,

    // Maximum request age for replay attack prevention (5 minutes)
    MAX_REQUEST_AGE: 5 * 60 * 1000,
};

// Helper function to check if a hostname is allowed to run without HTTPS
export function isAllowedHttpHost(hostname: string): boolean {
    return SECURITY_CONFIG.ALLOWED_HTTP_HOSTS.some(host => {
        if (host.startsWith('.')) {
            // Handle wildcard subdomains
            return hostname === host.slice(1) || hostname.endsWith(host);
        }
        return hostname === host;
    });
}

// Helper function to check if we're in development mode
export function isDevelopmentEnvironment(): boolean {
    if (typeof window === 'undefined') return process.env.NODE_ENV === 'development';

    const hostname = window.location.hostname;
    return process.env.NODE_ENV === 'development' ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0';
}

// Helper function to check if HTTPS is required for current environment
export function isHttpsRequired(hostname: string): boolean {
    if (!SECURITY_CONFIG.FORCE_HTTPS) {
        return false; // HTTPS not required in development
    }

    return !isAllowedHttpHost(hostname);
}

// Helper function to get security headers
export function getSecurityHeaders(): Record<string, string> {
    return {
        'Content-Security-Policy': SECURITY_CONFIG.SECURITY_HEADERS.CSP_POLICY,
        'X-Frame-Options': SECURITY_CONFIG.SECURITY_HEADERS.X_FRAME_OPTIONS,
        'X-Content-Type-Options': SECURITY_CONFIG.SECURITY_HEADERS.X_CONTENT_TYPE_OPTIONS,
        'X-XSS-Protection': SECURITY_CONFIG.SECURITY_HEADERS.X_XSS_PROTECTION,
        'Referrer-Policy': SECURITY_CONFIG.SECURITY_HEADERS.REFERRER_POLICY,
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
}

// Helper function to get HSTS header (only for HTTPS)
export function getHstsHeader(): string | null {
    if (!SECURITY_CONFIG.FORCE_HTTPS) {
        return null;
    }

    return `max-age=${SECURITY_CONFIG.SECURITY_HEADERS.HSTS_MAX_AGE}; includeSubDomains; preload`;
}

// Environment-specific configuration
export const ENV_CONFIG = {
    // Development environment settings
    development: {
        FORCE_HTTPS: false,
        ALLOWED_HTTP_HOSTS: ['localhost', '127.0.0.1', '0.0.0.0'],
        DEBUG_MODE: true,
    },

    // Production environment settings
    production: {
        FORCE_HTTPS: true,
        ALLOWED_HTTP_HOSTS: SECURITY_CONFIG.ALLOWED_HTTP_HOSTS,
        DEBUG_MODE: false,
    },

    // Test environment settings
    test: {
        FORCE_HTTPS: false,
        ALLOWED_HTTP_HOSTS: ['localhost', '127.0.0.1', 'test.yourdomain.com'],
        DEBUG_MODE: true,
    },
};

// Get current environment configuration
export function getCurrentEnvConfig() {
    const env = process.env.NODE_ENV || 'development';
    return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
} 