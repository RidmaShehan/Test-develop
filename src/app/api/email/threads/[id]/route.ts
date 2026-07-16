import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getValidAccessToken, sendGmailReply, sendMicrosoftReply } from '@/lib/oauth'
import { handleApiError } from '@/lib/handle-api-error'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const thread = await prisma.emailThread.findUnique({
      where: { id },
      include: {
        emailAccount: true,
        seeker: true,
        messages: {
          orderBy: { sentAt: 'asc' },
          include: { attachments: true }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Non-admins can only view their own connected email accounts' threads
    const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER', 'SYSTEM'].includes(user.role)
    if (!isAdmin && thread.emailAccount.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Mark all messages in the thread as read
    await prisma.emailInboxMessage.updateMany({
      where: { threadId: id, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json(thread)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const bodyData = await request.json()
    const { content } = bodyData

    if (!content) {
      return NextResponse.json({ error: 'Email content is required' }, { status: 400 })
    }

    const thread = await prisma.emailThread.findUnique({
      where: { id },
      include: {
        emailAccount: true,
        messages: {
          orderBy: { sentAt: 'desc' }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const token = await getValidAccessToken(thread.emailAccountId)
    const lastMessage = thread.messages[0]

    if (!lastMessage) {
      return NextResponse.json({ error: 'Cannot reply to an empty thread' }, { status: 400 })
    }

    // Pre-allocate a message ID for the open tracking pixel reference
    // Generate a secure-enough standard random identifier
    const tempId = `msg_${Math.random().toString(36).substring(2, 11)}`

    // Build tracking URL and embed invisible tracking image
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/track/open?msgId=${tempId}`
    const trackedContent = `${content}<br/><img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`

    // Determine target recipient (reply to incoming sender or outbound target)
    const toRecipient = lastMessage.direction === 'INBOUND' ? lastMessage.from : lastMessage.to

    let providerMessageId = `out_${Date.now()}`
    let success = false
    let errorMsg = ''

    if (thread.emailAccount.provider === 'GMAIL') {
      const sendResult = await sendGmailReply(
        token,
        toRecipient,
        thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
        trackedContent,
        thread.providerThreadId,
        lastMessage.providerMessageId
      )
      success = sendResult.success
      if (success && sendResult.providerMessageId) {
        providerMessageId = sendResult.providerMessageId
      }
      errorMsg = sendResult.error || ''
    } else {
      const sendResult = await sendMicrosoftReply(
        token,
        toRecipient,
        thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
        trackedContent,
        thread.providerThreadId
      )
      success = sendResult.success
      errorMsg = sendResult.error || ''
    }

    if (!success) {
      return NextResponse.json({ error: `Failed to send email: ${errorMsg}` }, { status: 500 })
    }

    // Save outbound message into database
    const createdMessage = await prisma.emailInboxMessage.create({
      data: {
        id: tempId,
        providerMessageId,
        threadId: id,
        from: thread.emailAccount.email,
        to: toRecipient,
        subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
        body: trackedContent,
        direction: 'OUTBOUND',
        sentAt: new Date(),
        isRead: true
      }
    })

    // Update thread timestamp
    await prisma.emailThread.update({
      where: { id },
      data: { lastMessageAt: new Date() }
    })

    // Log user activity
    const { logUserActivity } = await import('@/lib/audit')
    await logUserActivity({
      userId: user.id,
      activityType: 'EMAIL_SEND',
      metadata: { threadId: id, direction: 'OUTBOUND', recipient: toRecipient }
    })

    return NextResponse.json(createdMessage, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
