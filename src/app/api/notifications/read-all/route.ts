import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { invalidateUnreadCountCache } from '@/lib/notifications/unread-count-cache'

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Mark all user's notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    })

    // Invalidate cache
    invalidateUnreadCountCache(user.id)

    return NextResponse.json({
      message: 'All notifications marked as read',
      count: result.count,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

