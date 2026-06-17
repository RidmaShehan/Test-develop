import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { verifyToken } from '@/lib/auth'

// Update session activity timestamp
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token is still valid
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Update session activity (1 hour from now)
    const sessionExpiry = Date.now() + (60 * 60 * 1000) // 1 hour

    const response = NextResponse.json({ 
      success: true,
      expiresAt: sessionExpiry 
    })
    
    // Update session activity cookie
    response.cookies.set('session-activity', sessionExpiry.toString(), {
      httpOnly: false,
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






