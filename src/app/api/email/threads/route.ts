import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const seekerId = searchParams.get('seekerId')

    const where: any = {}

    // Non-admins can only see threads associated with their connected email accounts
    const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER', 'SYSTEM'].includes(user.role)
    if (!isAdmin) {
      where.emailAccount = { userId: user.id }
    }

    if (seekerId) {
      where.seekerId = seekerId
    }

    const threads = await prisma.emailThread.findMany({
      where,
      include: {
        seeker: {
          select: { id: true, fullName: true, email: true }
        },
        emailAccount: {
          select: { id: true, email: true, provider: true }
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    return NextResponse.json(threads)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { emailAccountId, seekerId, subject, content } = body

    if (!emailAccountId || !seekerId || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const seeker = await prisma.seeker.findUnique({ where: { id: seekerId } })
    if (!seeker || !seeker.email) {
      return NextResponse.json({ error: 'Student email not found' }, { status: 400 })
    }

    const emailAccount = await prisma.emailAccount.findUnique({ where: { id: emailAccountId } })
    if (!emailAccount || emailAccount.userId !== user.id) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    const { getValidAccessToken } = await import('@/lib/oauth')
    const token = await getValidAccessToken(emailAccount.id)

    // Pre-allocate a message ID for the open tracking pixel
    const tempId = `msg_${Math.random().toString(36).substring(2, 11)}`

    // Embed open tracking pixel in new email HTML body
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/track/open?msgId=${tempId}`
    const trackedContent = `${content}<br/><img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`

    let providerMessageId = `out_${Date.now()}`
    let providerThreadId = `th_${Date.now()}`
    let success = false
    let errorMsg = ''

    const { sendNewGmail, sendMicrosoftReply } = await import('@/lib/oauth')

    if (emailAccount.provider === 'GMAIL') {
      const sendResult = await sendNewGmail(token, seeker.email, subject, trackedContent)
      success = sendResult.success
      if (success) {
        providerMessageId = sendResult.providerMessageId || providerMessageId
        providerThreadId = sendResult.providerThreadId || providerThreadId
      }
      errorMsg = sendResult.error || ''
    } else {
      const sendResult = await sendMicrosoftReply(token, seeker.email, subject, trackedContent, '')
      success = sendResult.success
      errorMsg = sendResult.error || ''
    }

    if (!success) {
      return NextResponse.json({ error: `Failed to send email: ${errorMsg}` }, { status: 500 })
    }

    // Create the EmailThread
    const thread = await prisma.emailThread.create({
      data: {
        emailAccountId: emailAccount.id,
        providerThreadId,
        subject,
        seekerId,
        lastMessageAt: new Date(),
      }
    })

    // Create the EmailInboxMessage
    const message = await prisma.emailInboxMessage.create({
      data: {
        id: tempId,
        providerMessageId,
        threadId: thread.id,
        from: emailAccount.email,
        to: seeker.email,
        subject,
        body: trackedContent,
        direction: 'OUTBOUND',
        sentAt: new Date(),
        isRead: true
      }
    })

    // Log user activity
    const { logUserActivity } = await import('@/lib/audit')
    await logUserActivity({
      userId: user.id,
      activityType: 'EMAIL_SEND',
      metadata: { threadId: thread.id, direction: 'OUTBOUND', recipient: seeker.email }
    })

    return NextResponse.json({ threadId: thread.id, messageId: message.id }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
