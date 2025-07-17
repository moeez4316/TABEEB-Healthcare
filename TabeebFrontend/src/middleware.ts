import { NextResponse } from 'next/server';

export function middleware() {
  // For Firebase client-side auth, we mainly handle routing logic here
  // The actual auth checking is done in the RouteGuard components
  
  // Allow all requests to pass through
  // The actual auth checking will be done in the layout components
  return NextResponse.next();
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
