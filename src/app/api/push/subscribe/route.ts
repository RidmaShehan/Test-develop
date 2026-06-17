import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'

// POST /api/push/subscribe - Subscribe user to push notifications
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const { endpoint, keys, userAgent } = body

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Missing required fields: endpoint, keys.p256dh, keys.auth' },
        { status: 400 }
      )
    }

    // Detect device info
    const deviceInfo = {
      browser: userAgent?.includes('Chrome') ? 'Chrome' : 
               userAgent?.includes('Firefox') ? 'Firefox' :
               userAgent?.includes('Safari') && !userAgent?.includes('Chrome') ? 'Safari' :
               userAgent?.includes('Edge') ? 'Edge' : 'Unknown',
      os: userAgent?.includes('Windows') ? 'Windows' :
          userAgent?.includes('Mac') ? 'macOS' :
          userAgent?.includes('Linux') ? 'Linux' :
          userAgent?.includes('Android') ? 'Android' :
          userAgent?.includes('iOS') ? 'iOS' : 'Unknown',
      device: userAgent?.includes('Mobile') || userAgent?.includes('Android') || userAgent?.includes('iPhone') ? 'mobile' : 'desktop',
      isMobile: userAgent?.includes('Mobile') || userAgent?.includes('Android') || userAgent?.includes('iPhone') || false
    }

    // Upsert subscription (update if exists, create if not). Always tie to current user.
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: user.id,
        keys,
        userAgent: userAgent || request.headers.get('user-agent') || null,
        deviceInfo: deviceInfo as any,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        endpoint,
        keys: keys as any,
        userAgent: userAgent || request.headers.get('user-agent') || null,
        deviceInfo: deviceInfo as any,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        deviceInfo: subscription.deviceInfo
      }
    })
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    return handleApiError(error)
  }
}

