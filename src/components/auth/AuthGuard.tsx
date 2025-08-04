"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BASE_PATH_FRONT_END } from '@/utils/constants';
import { getAuthToken } from '@/utils/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if we're on an auth page or root path
    const isAuthPage = pathname?.startsWith('/signin') ||
      pathname?.startsWith('/otp-verification') ||
      pathname?.startsWith('/forgot-password') ||
      pathname?.startsWith('/sso') ||
      pathname === '/';

    // Get auth token from localStorage
    const authToken = getAuthToken();

    // If user is not authenticated and trying to access protected route
    if (!authToken && !isAuthPage) {
      const signInUrl = `${BASE_PATH_FRONT_END}/signin`;
      // Only redirect if we're not already on the signin page
      if (pathname !== '/signin') {
        router.replace(signInUrl);
      }
      setIsChecking(false);
      return;
    }

    // If user is authenticated and trying to access auth pages
    if (authToken && isAuthPage) {
      const dashboardUrl = `${BASE_PATH_FRONT_END}/dashboard`;
      // Only redirect if we're not already on the dashboard
      if (pathname !== '/dashboard') {
        router.replace(dashboardUrl);
      }
      setIsChecking(false);
      return;
    }

    // Additional check: If we have a token but it might be invalid
    // (this helps prevent API calls with invalid tokens)
    if (authToken && !isAuthPage) {
      // Check if token has expired by looking at tokenExpireTime
      const tokenExpireTime = localStorage.getItem('tokenExpireTime');
      if (tokenExpireTime) {
        const expireDate = new Date(tokenExpireTime);
        const now = new Date();
        
        if (expireDate < now) {
          // Token has expired, clear storage and redirect to login
          localStorage.clear();
          const signInUrl = `${BASE_PATH_FRONT_END}/signin`;
          router.replace(signInUrl);
          setIsChecking(false);
          return;
        }
      }
    }

    // If we reach here, the user is in the correct state
    setIsChecking(false);
  }, [pathname, router]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 