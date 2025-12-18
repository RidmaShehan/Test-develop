import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Public routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/api/auth/login',
  '/api/auth/register',
]

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

// Verify JWT token
function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Extract token from cookie or Authorization header
  const token = 
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  // If no token and not a public route, continue (let API routes handle auth)
  if (!token) {
    return NextResponse.next()
  }

  // Verify token and extract user info
  const decoded = verifyToken(token)
  
  if (decoded) {
    // Create a new response
    const response = NextResponse.next()
    
    // Set user headers for API routes to use
    response.headers.set('x-user-id', decoded.id)
    response.headers.set('x-user-email', decoded.email)
    response.headers.set('x-user-role', decoded.role)
    
    return response
  }

  // Invalid token - continue (let API routes handle auth errors)
  return NextResponse.next()
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
}