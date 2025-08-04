import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { BASE_PATH_FRONT_END } from './utils/constants';

export function middleware(request: NextRequest) {
  // Since we're moving to localStorage only, we can't check auth tokens in middleware
  // as middleware runs on the server side and can't access localStorage
  // We'll handle authentication checks on the client side instead

  const isAuthPage = request.nextUrl.pathname.startsWith('/signin') ||
    request.nextUrl.pathname.startsWith('/otp-verification') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/sso');

  // For auth pages, allow access
  if (isAuthPage) {
    return NextResponse.next();
  }

  // For all other pages, allow access and let client-side handle authentication
  // The client-side will redirect to login if no token is found in localStorage
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}