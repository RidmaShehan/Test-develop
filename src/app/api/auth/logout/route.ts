import { NextRequest, NextResponse } from 'next/server'
import { logLogout } from '@/lib/activity-logger'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get user info from token for logging
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        // Log logout activity
        await logLogout(decoded.id, request, token)
      }
    }
  } catch (error) {
    console.error('Error logging logout:', error)
    // Don't fail logout if logging fails
  }

  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  // Clear the auth token cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}
