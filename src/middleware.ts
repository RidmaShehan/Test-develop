import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

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
async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })

    // We only support the payload we generate elsewhere in the app.
    const id = payload.id
    const email = payload.email
    const role = payload.role

    if (typeof id !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
      return null
    }

    return { id, email, role }
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

  // If no token and not a public route, continue (let API routes handle auth)
  if (!token) {
    return NextResponse.next()
  }

  // Verify token and extract user info
  const decoded = await verifyToken(token)
  
  if (decoded) {
    // Forward user info to downstream handlers via request headers.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.id)
    requestHeaders.set('x-user-email', decoded.email)
    requestHeaders.set('x-user-role', decoded.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
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