import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import { logLogin, logFailedLogin } from '@/lib/activity-logger'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/handle-api-error'

export async function POST(request: NextRequest) {
  try {
    // Rate limit login attempts (e.g. 10 per minute per IP)
    const clientIp = getClientIp(request)
    if (!(await rateLimit(clientIp, { limit: 10, windowSeconds: 60 }))) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await login(email, password)

    if (!user) {
      // Log failed login attempt
      await logFailedLogin(email, request, 'Invalid credentials')
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Log successful login (do not pass token - never store JWTs in logs)
    await logLogin(user.id, request)

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    })

    // Set session activity timestamp (1 hour from now)
    const sessionExpiry = Date.now() + (60 * 60 * 1000) // 1 hour in milliseconds
    
    // Set HTTP-only cookie with cross-browser/OS compatibility
    response.cookies.set('auth-token', user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Works across browsers and OS
      maxAge: 60 * 60, // 1 hour in seconds (for cookie expiry)
      path: '/', // Ensure cookie is available site-wide
    })
    
    // Set session activity cookie (client-readable for inactivity check)
    response.cookies.set('session-activity', sessionExpiry.toString(), {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
