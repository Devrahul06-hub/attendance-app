import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight middleware that gates app pages on cookie presence.
 * Note: We can't verify the JWT here without `jsonwebtoken` (Node-only),
 * so this is a first line of defense — API routes do real verification.
 */
const PUBLIC_PATHS = ['/login', '/signup'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('ams_token')?.value;

  // Logged-in users hitting login/signup → bounce to dashboard
  if (token && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Anyone hitting a protected page without a token → login
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/attendance') ||
    pathname.startsWith('/admin');

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/attendance/:path*', '/admin/:path*', '/login', '/signup'],
};
