import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { sendBulkSMS } from '@/lib/sms'
import { AuthenticationError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('SEND_SMS', req)
    const body = await req.json()
    const { message, recipients, sender } = body

    if (!message || !recipients?.length) {
      return NextResponse.json({ error: 'message and recipients are required' }, { status: 400 })
    }

    // Save SMS message to DB
    const smsMessage = await prisma.sMSMessage.create({
      data: {
        userId: user.id,
        body: message,
        sender: sender || process.env.NOTIFY_LK_SENDER_ID || 'EduCRM',
        recipients: {
          create: recipients.map((r: any) => ({
            phone: r.phone,
            status: 'QUEUED',
          })),
        },
      },
      include: { recipients: true },
    })

    // Send bulk SMS asynchronously (don't await to return quickly)
    sendBulkSMS(
      recipients.map((r: any) => ({ phone: r.phone, name: r.name })),
      message
    ).then(async (results) => {
      // Update recipient statuses
      for (let i = 0; i < smsMessage.recipients.length; i++) {
        const result = results.results[i]
        await prisma.sMSRecipient.update({
          where: { id: smsMessage.recipients[i].id },
          data: {
            status: result?.success ? 'SENT' : 'FAILED',
            sentAt: result?.success ? new Date() : null,
          },
        })
      }
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      data: { messageId: smsMessage.id, recipientCount: recipients.length },
      message: `SMS queued for ${recipients.length} recipients`,
    }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
