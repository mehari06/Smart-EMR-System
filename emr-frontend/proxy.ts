import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Role-based route access map
const roleRoutes: Record<string, string[]> = {
  doctor:     ['/dashboard', '/patients', '/appointments', '/encounters', '/prescriptions', '/lab-orders', '/vitals', '/history', '/profile','/queue','/lab-results'],
  nurse:      ['/dashboard', '/patients', '/appointments', '/encounters', '/vitals', '/history', '/profile', '/queue'],
  receptionist: ['/dashboard', '/patients', '/appointments', '/profile','/queue'], // No clinical data
  pharmacist: ['/dashboard', '/prescriptions', '/profile','/queue'],
  lab_tech:   ['/dashboard', '/lab-orders', '/profile','/queue'],
  patient:    ['/dashboard', '/appointments', '/history', '/profile','/queue', '/lab-results','/medications', '/radiology-results'],
  staff_head: ['/dashboard', '/patients', '/appointments', '/encounters', '/prescriptions', '/lab-orders', '/settings', '/profile','/queue','/audit-logs'],
};

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'django-insecure-c$h@va43p^7%npl(6jfwu8fgujkadr#cb3_7jey#ihi30w&!x3'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Get access token from cookie
  const token = request.cookies.get('access_token')?.value;

  // 3. No token → redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Decode JWT and extract role
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] });
    const role = payload['role'] as string | undefined;

    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (role === 'admin') {
      return NextResponse.next();
    }

    // 5. Check if this role is allowed on this route
    const allowedRoutes = roleRoutes[role] ?? [];
    const isAllowed = allowedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

    if (!isAllowed) {
      // Redirect to dashboard as a safe fallback
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    // Token invalid/expired — clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|avatars).*)'],
};
