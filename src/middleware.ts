import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/signin') || 
                    request.nextUrl.pathname.startsWith('/otp-verification');

  // If user is not authenticated and trying to access protected route
  if (!authToken && !isAuthPage) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If user is authenticated and trying to access auth pages
  if (authToken && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}