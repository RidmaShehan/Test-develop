import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import {
  getValidAccessToken,
  fetchGmailMessages,
  fetchMicrosoftMessages,
} from '@/lib/oauth'
import { handleApiError } from '@/lib/handle-api-error'

// Helper to extract email addresses from headers like '"John Doe" <john@example.com>'
function extractEmailAddress(header: string): string {
  const match = header.match(/<([^>]+)>/)
  return (match ? match[1] : header).trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get all connected email accounts for this user
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: user.id },
    })

    if (emailAccounts.length === 0) {
      return NextResponse.json({ message: 'No connected email accounts found' }, { status: 200 })
    }

    let totalSynced = 0

    for (const account of emailAccounts) {
      try {
        const token = await getValidAccessToken(account.id)
        
        let rawMessages: any[] = []
        if (account.provider === 'GMAIL') {
          rawMessages = await fetchGmailMessages(token, 15)
        } else if (account.provider === 'MICROSOFT') {
          rawMessages = await fetchMicrosoftMessages(token, 15)
        }

        for (const msg of rawMessages) {
          const fromEmail = extractEmailAddress(msg.from)
          const toEmail = extractEmailAddress(msg.to)

          // Try to match with seeker record
          const seeker = await prisma.seeker.findFirst({
            where: {
              OR: [
                { email: { equals: fromEmail, mode: 'insensitive' } },
                { email: { equals: toEmail, mode: 'insensitive' } }
              ]
            }
          })

          // Upsert the email thread
          const thread = await prisma.emailThread.upsert({
            where: {
              emailAccountId_providerThreadId: {
                emailAccountId: account.id,
                providerThreadId: msg.providerThreadId,
              },
            },
            update: {
              lastMessageAt: msg.sentAt,
              ...(seeker ? { seekerId: seeker.id } : {}),
            },
            create: {
              emailAccountId: account.id,
              providerThreadId: msg.providerThreadId,
              subject: msg.subject,
              lastMessageAt: msg.sentAt,
              seekerId: seeker?.id || null,
            },
          })

          // Check if message is already synced
          const existingMessage = await prisma.emailInboxMessage.findUnique({
            where: { providerMessageId: msg.providerMessageId },
          })

          if (!existingMessage) {
            const direction = fromEmail === account.email.toLowerCase() ? 'OUTBOUND' : 'INBOUND'

            await prisma.emailInboxMessage.create({
              data: {
                providerMessageId: msg.providerMessageId,
                threadId: thread.id,
                from: msg.from,
                to: msg.to,
                subject: msg.subject,
                body: msg.body,
                direction,
                sentAt: msg.sentAt,
                isRead: direction === 'OUTBOUND',
              },
            })

            totalSynced++

            // If a seeker is matched and it is inbound, log an Interaction
            if (seeker && direction === 'INBOUND') {
              await prisma.interaction.create({
                data: {
                  seekerId: seeker.id,
                  userId: user.id,
                  channel: 'EMAIL',
                  outcome: 'CONNECTED_INTERESTED',
                  notes: `Auto-logged inbound email thread: "${msg.subject}"`,
                },
              })
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing account ${account.email}:`, err)
      }
    }

    // Log user activity
    const { logUserActivity } = await import('@/lib/audit')
    await logUserActivity({
      userId: user.id,
      activityType: 'EMAIL_SYNC',
      metadata: { syncedCount: totalSynced }
    })

    return NextResponse.json({ success: true, syncedCount: totalSynced })
  } catch (error) {
    return handleApiError(error)
  }
}
