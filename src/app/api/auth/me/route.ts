import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { getCurrentUser } from '@/lib/auth'
import { getEffectivePermissionsAndRolesForUser } from '@/lib/authorization'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    // Check session activity
    const activityCookie = request.cookies.get('session-activity')?.value
    if (activityCookie) {
      try {
        const expiresAt = parseInt(activityCookie, 10)
        const now = Date.now()
        if (!isNaN(expiresAt) && now >= expiresAt) {
          // Session expired - clear cookies and return unauthorized
          const response = NextResponse.json(
            { error: 'Session expired due to inactivity' },
            { status: 401 }
          )
          response.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
          response.cookies.set('session-activity', '', { maxAge: 0, path: '/' })
          return response
        }
      } catch {
        // Invalid activity cookie - treat as expired
      }
    }

    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { permissions, roles } = await getEffectivePermissionsAndRolesForUser(user.id)

    // Update session activity on successful auth check
    const sessionExpiry = Date.now() + (60 * 60 * 1000) // 1 hour
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions,
        roles
      }
    })
    
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
