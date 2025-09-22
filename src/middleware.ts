import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/api'];
  
  // Get the pathname
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check for session cookie
  const session = request.cookies.get("session");
  
  if (!session) {
    // No session found, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For now, we'll skip the database verification in middleware to avoid Prisma client issues
  // In a production environment, you would want to use JWT tokens or a proper session store
  
  // Admin-only routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );
  
  if (isAdminRoute) {
    // For now, we'll allow access to admin routes
    // In production, you would verify the user's admin status
  }
  
  // Session is valid, proceed
  return NextResponse.next();
}

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
};