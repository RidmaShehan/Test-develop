import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own emails
    if (!isAdminRole(user.role)) {
      where.userId = user.id
    }

    // Fetch email messages with recipients and attachments
    const [messages, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recipients: {
            include: {
              seeker: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              mimeType: true,
              size: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.emailMessage.count({ where }),
    ])

    // Format response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      subject: msg.subject,
      message: msg.message,
      recipientCount: msg.recipientCount,
      sentCount: msg.sentCount,
      failedCount: msg.failedCount,
      attachmentCount: msg.attachments.length,
      sentAt: msg.sentAt.toISOString(),
      user: {
        id: msg.user.id,
        name: msg.user.name,
        email: msg.user.email,
      },
      recipients: msg.recipients.map(rec => ({
        id: rec.id,
        email: rec.email,
        status: rec.status,
        errorMessage: rec.errorMessage,
        sentAt: rec.sentAt?.toISOString(),
        seeker: {
          id: rec.seeker.id,
          fullName: rec.seeker.fullName,
          email: rec.seeker.email || '',
        },
      })),
      attachments: msg.attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
      })),
    }))

    return NextResponse.json({
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching email history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email history' },
      { status: 500 }
    )
  }
}

