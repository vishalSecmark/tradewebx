# Security Configuration Guide

## Quick Setup for Development and Testing

### 1. Development Mode Configuration

To enable development mode and allow your application to run without HTTPS on localhost, set the `NEXT_DEVELOPMENT_MODE` environment variable in your `.env` file:

```bash
# Enable development mode (allows localhost without HTTPS)
NEXT_DEVELOPMENT_MODE=true
```

**Default Behavior:**
- If `NEXT_DEVELOPMENT_MODE` is not defined or set to `false`: HTTPS is required
- If `NEXT_DEVELOPMENT_MODE=true`: Allows localhost, 127.0.0.1, and 0.0.0.0 without HTTPS

### 2. Environment Variables

Add the following to your `.env` file:

```bash
# Development Mode Configuration
# Set to 'true' to enable development mode (allows localhost without HTTPS)
# Default is 'false' or undefined
NEXT_DEVELOPMENT_MODE=false
```

### 3. Environment-Specific Configuration

The security configuration automatically adapts based on your environment:

- **Development Mode Enabled** (`NEXT_DEVELOPMENT_MODE=true`): HTTPS not required, allows localhost
- **Development Mode Disabled** (`NEXT_DEVELOPMENT_MODE=false` or undefined): HTTPS required
- **Production** (`NODE_ENV=production`): HTTPS required except for allowed hosts
- **Test** (`NODE_ENV=test`): HTTPS not required if development mode is enabled

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
```bash
# .env file
NEXT_DEVELOPMENT_MODE=true
```

### Scenario 2: Production Deployment
```bash
# .env file
NEXT_DEVELOPMENT_MODE=false
# or simply don't define it (defaults to false)
```

### Scenario 3: Testing Environment
```bash
# .env file
NEXT_DEVELOPMENT_MODE=true
NODE_ENV=test
```

## Troubleshooting

### Issue: "Security Error: HTTPS required"
**Solution**: Set `NEXT_DEVELOPMENT_MODE=true` in your `.env` file for local development

### Issue: "Too many login attempts"
**Solution**: Adjust `MAX_LOGIN_ATTEMPTS` and `LOCKOUT_DURATION` in the rate limiting configuration

### Issue: API requests blocked
**Solution**: Check if development mode is enabled and adjust rate limiting settings

### Issue: Security headers too strict
**Solution**: Modify the CSP policy in `SECURITY_HEADERS.CSP_POLICY`

## Security Best Practices

1. **Never enable development mode in production** - Always set `NEXT_DEVELOPMENT_MODE=false` or undefined
2. **Use environment-specific configurations** - Different settings for dev, test, and production
3. **Regularly review security settings** - Ensure proper configuration for each environment
4. **Test security measures** in staging before production
5. **Monitor security logs** for any violations

## Quick Commands

### Enable development mode:
1. Add `NEXT_DEVELOPMENT_MODE=true` to your `.env` file
2. Restart your development server

### Disable development mode:
1. Set `NEXT_DEVELOPMENT_MODE=false` or remove it from `.env` file
2. Restart your development server

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
# Development Mode
NEXT_DEVELOPMENT_MODE=true

# Environment
NODE_ENV=development

# Custom security key (optional)
SECURITY_KEY=your-custom-security-key
```

## Support

For security configuration issues:
1. Check the browser console for error messages
2. Verify your development mode setting in `.env` file
3. Ensure environment variables are set correctly
4. Review the security logs for violations 