import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

export async function logUserActivity({
  userId,
  activityType,
  isSuccessful = true,
  failureReason = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}: {
  userId: string
  activityType: ActivityType
  isSuccessful?: boolean
  failureReason?: string | null
  metadata?: Record<string, any>
  ipAddress?: string | null
  userAgent?: string | null
}) {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId,
        activityType,
        isSuccessful,
        failureReason,
        metadata: metadata || {},
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    console.error('Failed to save user activity log:', err)
  }
}
