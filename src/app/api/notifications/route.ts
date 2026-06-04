import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { invalidateUnreadCountCache } from '@/lib/notifications/unread-count-cache'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    // Build where clause
    const where: any = { userId: user.id }
    if (unreadOnly) {
      where.read = false
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a notification for current user
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const entityType = typeof body?.entityType === 'string' ? body.entityType : undefined
    const requestedType = typeof body?.type === 'string' ? body.type : undefined
    const postId = typeof body?.postId === 'string' ? body.postId : undefined

    if (!title || !message) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 })
    }

    // Prisma enum: POST_APPROVAL_REQUEST | POST_APPROVED | POST_REJECTED | POST_FULLY_APPROVED | SYSTEM | REMINDER
    // Default non-post app notifications to SYSTEM; map reminders explicitly.
    const type =
      requestedType && ['POST_APPROVAL_REQUEST', 'POST_APPROVED', 'POST_REJECTED', 'POST_FULLY_APPROVED', 'SYSTEM', 'REMINDER'].includes(requestedType)
        ? requestedType
        : entityType === 'note' || entityType === 'task' || entityType === 'meeting'
          ? 'REMINDER'
          : 'SYSTEM'

    const created = await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        type,
        postId: postId || null,
      },
    })

    invalidateUnreadCountCache(user.id)

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create notification' },
      { status: 500 }
    )
  }
}

