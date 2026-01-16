import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const USER_JWT_SECRET = new TextEncoder().encode(
  process.env.USER_JWT_SECRET || 'user-secret-key-change-in-production'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for static assets
  const isStaticAsset = pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2)$/);
  if (pathname === '/' || isStaticAsset) {
    return NextResponse.next();
  }

  // Admin routes handle their own auth
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // API routes handle their own auth
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Protected routes that require user authentication
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isLoginPath = pathname === '/login';

  // Get user token
  const token = request.cookies.get('user_token')?.value;

  if (isProtectedPath) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Verify token
    try {
      await jwtVerify(token, USER_JWT_SECRET);
    } catch {
      // Invalid token, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('user_token');
      return response;
    }
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (isLoginPath && token) {
    try {
      await jwtVerify(token, USER_JWT_SECRET);
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    } catch {
      // Invalid token, allow access to login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
