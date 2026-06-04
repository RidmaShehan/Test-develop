import { prisma } from '@/lib/prisma'
import { sendDocumentReminderEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Process all pending document requests and send reminders at 7/3/1/0 days before due date
export async function processAllPendingDocumentRequests() {
  const pendingRequests = await prisma.documentRequest.findMany({
    where: {
      fulfilled: false,
      dueDate: { not: null },
    },
    include: {
      seeker: true,
      documentType: true,
    },
  })

  let sent = 0
  let skipped = 0

  for (const req of pendingRequests) {
    if (!req.dueDate || !req.seeker.email) {
      skipped++
      continue
    }

    const daysRemaining = Math.ceil(
      (req.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    // Send reminders at 7, 3, 1 days before and on due date
    const reminderDays = [7, 3, 1, 0]
    if (!reminderDays.includes(daysRemaining)) {
      skipped++
      continue
    }

    // Don't send more than 4 reminders total
    if (req.reminderCount >= 4) {
      skipped++
      continue
    }

    try {
      await sendDocumentReminderEmail({
        toEmail: req.seeker.email,
        toName: req.seeker.fullName,
        documentName: req.documentType.name,
        daysRemaining,
        portalLink: `${APP_URL}/portal/${req.seeker.id}`,
        reminderCount: req.reminderCount + 1,
      })

      await prisma.documentRequest.update({
        where: { id: req.id },
        data: {
          reminderCount: { increment: 1 },
          lastReminderAt: new Date(),
        },
      })

      sent++
    } catch (err) {
      console.error(`Failed to send reminder for request ${req.id}:`, err)
    }
  }

  return { sent, skipped, total: pendingRequests.length }
}

// Single reminder for a specific document request
export async function processSingleDocumentReminder(requestId: string) {
  const req = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: {
      seeker: true,
      documentType: true,
    },
  })

  if (!req || req.fulfilled) return { success: false, reason: 'Request not found or already fulfilled' }
  if (!req.seeker.email) return { success: false, reason: 'No email on file' }

  const daysRemaining = req.dueDate
    ? Math.ceil((req.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 999

  await sendDocumentReminderEmail({
    toEmail: req.seeker.email,
    toName: req.seeker.fullName,
    documentName: req.documentType.name,
    daysRemaining,
    portalLink: `${APP_URL}/portal/${req.seeker.id}`,
    reminderCount: req.reminderCount + 1,
  })

  await prisma.documentRequest.update({
    where: { id: req.id },
    data: {
      reminderCount: { increment: 1 },
      lastReminderAt: new Date(),
    },
  })

  return { success: true }
}
