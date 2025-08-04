# Security Configuration Guide

## Quick Setup for Development and Testing

### 1. Allowed HTTP Hosts Configuration

To allow your development and testing URLs to run without HTTPS, edit the `ALLOWED_HTTP_HOSTS` array in `src/utils/securityConfig.ts`:

```typescript
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
```

### 2. Adding Your Testing URLs

Replace the example URLs with your actual testing domains:

```typescript
// Example for your specific domains
ALLOWED_HTTP_HOSTS: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    // Your actual testing URLs
    'test.mydomain.com',
    'staging.mydomain.com',
    'dev.mydomain.com',
    '.mydomain.com',  // Allows all subdomains
    'local.mydomain.com',
    'qa.mydomain.com'
],
```

### 3. Environment-Specific Configuration

The security configuration automatically adapts based on your environment:

- **Development** (`NODE_ENV=development`): HTTPS not required, allows localhost
- **Production** (`NODE_ENV=production`): HTTPS required except for allowed hosts
- **Test** (`NODE_ENV=test`): HTTPS not required, allows localhost and test domains

### 4. Rate Limiting Configuration

Adjust rate limiting settings in `src/utils/securityConfig.ts`:

```typescript
RATE_LIMITING: {
    MAX_LOGIN_ATTEMPTS: 5,           // Number of failed login attempts
    LOCKOUT_DURATION: 15 * 60 * 1000, // Lockout duration in milliseconds (15 minutes)
    API_RATE_LIMIT: 100,             // API requests per minute
},
```

### 5. Security Headers Customization

Modify security headers in `src/utils/securityConfig.ts`:

```typescript
SECURITY_HEADERS: {
    CSP_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
    HSTS_MAX_AGE: '31536000', // 1 year
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
},
```

## Common Configuration Scenarios

### Scenario 1: Local Development
```typescript
ALLOWED_HTTP_HOSTS: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'local.mydomain.com'
],
```

### Scenario 2: Multiple Testing Environments
```typescript
ALLOWED_HTTP_HOSTS: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'dev.mydomain.com',
    'staging.mydomain.com',
    'qa.mydomain.com',
    'test.mydomain.com',
    '.mydomain.com'  // Allows all subdomains
],
```

### Scenario 3: Strict Production Only
```typescript
ALLOWED_HTTP_HOSTS: [
    // Only allow specific production subdomains
    'admin.mydomain.com',
    'api.mydomain.com'
],
```

## Troubleshooting

### Issue: "Security Error: HTTPS required"
**Solution**: Add your domain to `ALLOWED_HTTP_HOSTS` in `src/utils/securityConfig.ts`

### Issue: "Too many login attempts"
**Solution**: Adjust `MAX_LOGIN_ATTEMPTS` and `LOCKOUT_DURATION` in the rate limiting configuration

### Issue: API requests blocked
**Solution**: Check if your domain is in the allowed hosts list and adjust rate limiting settings

### Issue: Security headers too strict
**Solution**: Modify the CSP policy in `SECURITY_HEADERS.CSP_POLICY`

## Security Best Practices

1. **Never add production domains** to `ALLOWED_HTTP_HOSTS` unless absolutely necessary
2. **Use specific domains** instead of wildcards when possible
3. **Regularly review** and update the allowed hosts list
4. **Test security measures** in staging before production
5. **Monitor security logs** for any violations

## Quick Commands

### Add a new testing domain:
1. Open `src/utils/securityConfig.ts`
2. Add your domain to `ALLOWED_HTTP_HOSTS`
3. Restart your development server

### Disable HTTPS requirement temporarily:
```typescript
FORCE_HTTPS: false, // Only for development
```

### Adjust rate limiting:
```typescript
RATE_LIMITING: {
    MAX_LOGIN_ATTEMPTS: 10,  // Increase attempts
    LOCKOUT_DURATION: 5 * 60 * 1000, // Reduce lockout to 5 minutes
},
```

## Environment Variables

Set these environment variables for additional control:

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production

# Custom security key (optional)
SECURITY_KEY=your-custom-security-key
```

## Support

For security configuration issues:
1. Check the browser console for error messages
2. Verify your domain is in the allowed hosts list
3. Ensure environment variables are set correctly
4. Review the security logs for violations 