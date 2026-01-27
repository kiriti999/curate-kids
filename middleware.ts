import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const requireLogin = process.env.NEXT_PUBLIC_REQUIRE_LOGIN === 'true'
  
  // If login is not required, allow all requests
  if (!requireLogin) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  
  // Allow access to login page, API routes, and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/admin-login') ||
    pathname.startsWith('/link') ||  // Allow Telegram linking flow
    pathname.includes('.') // Static files (images, fonts, etc.)
  ) {
    return NextResponse.next()
  }

  // Check for authentication cookie
  const token = request.cookies.get('payload-token')
  
  // If no token and trying to access protected route, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, allow access
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
