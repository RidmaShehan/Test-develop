import { FollowUpStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const DEFAULT_BREACH_THRESHOLD_HOURS = 48

const ACTIVE_STATUSES: FollowUpStatus[] = [
  FollowUpStatus.OPEN,
  FollowUpStatus.TODO,
  FollowUpStatus.IN_PROGRESS,
  FollowUpStatus.ON_HOLD,
  FollowUpStatus.OVERDUE,
]

export type InquiryComplianceItem = {
  seekerId: string
  seekerName: string
  seekerPhone: string
  stage: string
  marketingSource: string
  openTaskCount: number
  latestTaskStatus: string
  latestTaskDueAt: string | null
  lastFollowedAt: string
  hoursSinceLastFollowUp: number
  isBreach: boolean
}

export type CoordinatorComplianceRow = {
  coordinatorId: string
  coordinatorName: string
  coordinatorEmail: string
  activeInquiryCount: number
  breachCount: number
  complianceRate: number
  lastActivityAt: string | null
  inquiries: InquiryComplianceItem[]
}

export type FollowUpComplianceResult = {
  generatedAt: string
  breachThresholdHours: number
  summary: {
    coordinatorCount: number
    totalActiveInquiries: number
    totalBreaches: number
    overallComplianceRate: number
  }
  coordinators: CoordinatorComplianceRow[]
}

/**
 * Computes per-coordinator inquiry follow-up compliance from open follow-up tasks.
 * A breach means no task activity (update or action history) within breachThresholdHours.
 */
export async function computeFollowUpCompliance(
  breachThresholdHours: number = DEFAULT_BREACH_THRESHOLD_HOURS
): Promise<FollowUpComplianceResult> {
  const now = new Date()

  const coordinators = await prisma.user.findMany({
    where: {
      role: 'COORDINATOR',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const tasks = await prisma.followUpTask.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
    },
    select: {
      id: true,
      seekerId: true,
      assignedTo: true,
      dueAt: true,
      status: true,
      updatedAt: true,
      seeker: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          stage: true,
          marketingSource: true,
        },
      },
      actionHistory: {
        select: {
          actionAt: true,
        },
        orderBy: {
          actionAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: [{ assignedTo: 'asc' }, { seekerId: 'asc' }, { dueAt: 'asc' }],
  })

  type TaskRow = (typeof tasks)[number]
  const tasksByCoordinatorAndSeeker = new Map<string, TaskRow[]>()
  for (const task of tasks) {
    const key = `${task.assignedTo}:${task.seekerId}`
    const current = tasksByCoordinatorAndSeeker.get(key) || []
    current.push(task)
    tasksByCoordinatorAndSeeker.set(key, current)
  }

  const coordinatorItems: CoordinatorComplianceRow[] = coordinators.map((coordinator) => {
    const inquiries: InquiryComplianceItem[] = []

    for (const [key, groupedTasks] of tasksByCoordinatorAndSeeker.entries()) {
      const [assignedTo] = key.split(':')
      if (assignedTo !== coordinator.id) continue

      const firstTask = groupedTasks[0]
      if (!firstTask?.seeker) continue

      let lastFollowedAt = firstTask.updatedAt
      for (const task of groupedTasks) {
        if (task.updatedAt > lastFollowedAt) {
          lastFollowedAt = task.updatedAt
        }
        const latestAction = task.actionHistory[0]?.actionAt
        if (latestAction && latestAction > lastFollowedAt) {
          lastFollowedAt = latestAction
        }
      }

      const latestTask = groupedTasks.reduce((latest, current) =>
        current.updatedAt > latest.updatedAt ? current : latest
      )
      const latestDue = groupedTasks.reduce((latest, current) =>
        current.dueAt > latest.dueAt ? current : latest
      )

      const hoursSinceLastFollowUp = (now.getTime() - lastFollowedAt.getTime()) / (1000 * 60 * 60)
      const isBreach = hoursSinceLastFollowUp >= breachThresholdHours

      inquiries.push({
        seekerId: firstTask.seeker.id,
        seekerName: firstTask.seeker.fullName,
        seekerPhone: firstTask.seeker.phone,
        stage: firstTask.seeker.stage,
        marketingSource: firstTask.seeker.marketingSource,
        openTaskCount: groupedTasks.length,
        latestTaskStatus: latestTask.status,
        latestTaskDueAt: latestDue.dueAt ? latestDue.dueAt.toISOString() : null,
        lastFollowedAt: lastFollowedAt.toISOString(),
        hoursSinceLastFollowUp: Math.round(hoursSinceLastFollowUp * 10) / 10,
        isBreach,
      })
    }

    inquiries.sort((a, b) => b.hoursSinceLastFollowUp - a.hoursSinceLastFollowUp)

    const breachCount = inquiries.filter((inquiry) => inquiry.isBreach).length
    const activeInquiryCount = inquiries.length
    const complianceRate =
      activeInquiryCount > 0
        ? Math.round(((activeInquiryCount - breachCount) / activeInquiryCount) * 1000) / 10
        : 100
    const lastActivity =
      inquiries.length > 0
        ? inquiries.reduce((latest, item) =>
            new Date(item.lastFollowedAt) > new Date(latest.lastFollowedAt) ? item : latest
          )
        : null

    return {
      coordinatorId: coordinator.id,
      coordinatorName: coordinator.name,
      coordinatorEmail: coordinator.email,
      activeInquiryCount,
      breachCount,
      complianceRate,
      lastActivityAt: lastActivity?.lastFollowedAt || null,
      inquiries,
    }
  })

  const totalActiveInquiries = coordinatorItems.reduce((sum, item) => sum + item.activeInquiryCount, 0)
  const totalBreaches = coordinatorItems.reduce((sum, item) => sum + item.breachCount, 0)

  return {
    generatedAt: now.toISOString(),
    breachThresholdHours,
    summary: {
      coordinatorCount: coordinatorItems.length,
      totalActiveInquiries,
      totalBreaches,
      overallComplianceRate:
        totalActiveInquiries > 0
          ? Math.round(((totalActiveInquiries - totalBreaches) / totalActiveInquiries) * 1000) / 10
          : 100,
    },
    coordinators: coordinatorItems,
  }
}

export const COMPLIANCE_ALERT_TITLE = '48h follow-up compliance alert'

export function buildComplianceAlertMessage(totalBreaches: number, thresholdHours: number): string {
  return `Total breaches: ${totalBreaches}. Threshold: ${thresholdHours}h. Review coordinator follow-ups on the dashboard.`
}

/**
 * Parse breach count from a stored compliance alert message (for deduplication).
 */
export function parseBreachesFromAlertMessage(message: string): number | null {
  const m = message.match(/Total breaches:\s*(\d+)/i)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) ? n : null
}
