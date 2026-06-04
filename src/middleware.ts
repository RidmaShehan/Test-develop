import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getJwtSecretOrNull } from '@/lib/get-jwt-secret'

// Public routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/portal',
]

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route))
}

// Edge-compatible JWT verify (middleware runs in Edge Runtime; jsonwebtoken is Node-only)
async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
  const secret = getJwtSecretOrNull()
  if (!secret) return null
  try {
    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    const id = payload.id ?? payload.sub
    if (typeof id !== 'string' || typeof payload.email !== 'string' || typeof payload.role !== 'string') {
      return null
    }
    return { id, email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Extract token from cookie or Authorization header
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  // No token: redirect to sign-in for protected page routes
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Verify token and extract user info (async for jose)
  const decoded = await verifyToken(token)

  if (!decoded) {
    // Invalid or expired token: clear auth cookie and redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('returnTo', pathname)
    const response = NextResponse.redirect(signInUrl)
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
    response.cookies.set('session-activity', '', { maxAge: 0, path: '/' })
    return response
  }

  // Valid token: continue and set user headers for downstream use
  const response = NextResponse.next()
  response.headers.set('x-user-id', decoded.id)
  response.headers.set('x-user-email', decoded.email)
  response.headers.set('x-user-role', decoded.role)

  // Update session activity cookie for page requests (client may read for inactivity UI)
  const sessionExpiry = Date.now() + (60 * 60 * 1000) // 1 hour
  response.cookies.set('session-activity', sessionExpiry.toString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  })

  return response
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
