import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  buildComplianceAlertMessage,
  COMPLIANCE_ALERT_TITLE,
  computeFollowUpCompliance,
  DEFAULT_BREACH_THRESHOLD_HOURS,
  parseBreachesFromAlertMessage,
} from '@/lib/follow-up-compliance'
import { createNotification } from '@/lib/notification-service'
import { handleApiError } from '@/lib/handle-api-error'

/** Do not re-notify admins if the same breach count was already alerted within this window. */
const DEDUPE_WINDOW_MS = 4 * 60 * 60 * 1000

/**
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set in the project.
 * @see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 * Manual runs may use `x-cron-secret` instead.
 */
function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return false
  }
  const auth = request.headers.get('authorization')
  // Exact match as recommended by Vercel (avoids parsing edge cases).
  if (auth === `Bearer ${secret}`) {
    return true
  }
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const header = request.headers.get('x-cron-secret')?.trim()
  return bearer === secret || header === secret
}

/** Cron must not be statically cached; Vercel invokes this as a serverless function. */
export const dynamic = 'force-dynamic'

async function runComplianceNotifications(request: NextRequest) {
  // Guard check (additional sanity check before DB query)
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const threshold = DEFAULT_BREACH_THRESHOLD_HOURS
  const result = await computeFollowUpCompliance(threshold)
  const { totalBreaches } = result.summary

  if (totalBreaches === 0) {
    return NextResponse.json({
      ok: true,
      notified: false,
      reason: 'no_breaches',
      summary: result.summary,
      generatedAt: result.generatedAt,
    })
  }

  const since = new Date(Date.now() - DEDUPE_WINDOW_MS)
  const recent = await prisma.notification.findFirst({
    where: {
      type: 'SYSTEM',
      title: COMPLIANCE_ALERT_TITLE,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (recent) {
    const prevCount = parseBreachesFromAlertMessage(recent.message)
    if (prevCount === totalBreaches) {
      return NextResponse.json({
        ok: true,
        notified: false,
        reason: 'deduped_same_breach_count',
        dedupeWindowHours: DEDUPE_WINDOW_MS / (60 * 60 * 1000),
        totalBreaches,
        summary: result.summary,
        generatedAt: result.generatedAt,
      })
    }
  }

  const admins = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        in: [UserRole.ADMIN, UserRole.ADMINISTRATOR, UserRole.DEVELOPER],
      },
    },
    select: { id: true },
  })

  const message = buildComplianceAlertMessage(totalBreaches, threshold)

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: 'SYSTEM',
        title: COMPLIANCE_ALERT_TITLE,
        message,
      })
    )
  )

  return NextResponse.json({
    ok: true,
    notified: true,
    adminCount: admins.length,
    totalBreaches,
    summary: result.summary,
    generatedAt: result.generatedAt,
  })
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return await runComplianceNotifications(request)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return await runComplianceNotifications(request)
  } catch (error) {
    return handleApiError(error)
  }
}
