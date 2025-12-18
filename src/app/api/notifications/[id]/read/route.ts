import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { invalidateUnreadCountCache } from '@/lib/notifications/unread-count-cache'

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to mark this notification as read' },
        { status: 403 }
      )
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    // Invalidate cache
    invalidateUnreadCountCache(user.id)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

