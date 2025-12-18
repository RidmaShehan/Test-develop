import { prisma } from '@/lib/prisma'
import { getLocationFromIP, parseUserAgent, getClientIP } from '@/lib/geolocation'
import { NextRequest } from 'next/server'
import { ActivityType } from '@prisma/client'

interface LogActivityParams {
  userId: string
  activityType: ActivityType
  request: NextRequest
  sessionId?: string
  isSuccessful?: boolean
  failureReason?: string
  metadata?: any
}

export async function logUserActivity({
  userId,
  activityType,
  request,
  sessionId,
  isSuccessful = true,
  failureReason,
  metadata
}: LogActivityParams) {
  try {
    // Check if activity logging is enabled
    const loggingEnabled = await prisma.systemSettings.findUnique({
      where: { key: 'USER_ACTIVITY_LOGGING_ENABLED' }
    })

    if (!loggingEnabled || loggingEnabled.value !== 'true') {
      return null
    }

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const deviceInfo = parseUserAgent(userAgent)
    
    // Get location data asynchronously (don't block the main flow)
    const locationData = await getLocationFromIP(ipAddress)

    // Create the activity log
    const activityLog = await prisma.userActivityLog.create({
      data: {
        userId,
        activityType,
        ipAddress,
        userAgent,
        location: locationData as any, // Cast to any to satisfy Prisma Json type
        sessionId,
        deviceInfo: deviceInfo as any, // Cast to any to satisfy Prisma Json type
        isSuccessful,
        failureReason,
        metadata
      }
    })

    return activityLog
  } catch (error) {
    console.error('Error logging user activity:', error)
    // Don't throw error to avoid breaking the main flow
    return null
  }
}

export async function logLogin(userId: string, request: NextRequest, sessionId?: string) {
  return logUserActivity({
    userId,
    activityType: 'LOGIN',
    request,
    sessionId,
    isSuccessful: true,
    metadata: {
      loginTime: new Date().toISOString()
    }
  })
}

export async function logLogout(userId: string, request: NextRequest, sessionId?: string) {
  return logUserActivity({
    userId,
    activityType: 'LOGOUT',
    request,
    sessionId,
    isSuccessful: true,
    metadata: {
      logoutTime: new Date().toISOString()
    }
  })
}

export async function logFailedLogin(email: string, request: NextRequest, reason: string) {
  try {
    // Check if activity logging is enabled
    const loggingEnabled = await prisma.systemSettings.findUnique({
      where: { key: 'USER_ACTIVITY_LOGGING_ENABLED' }
    })

    if (!loggingEnabled || loggingEnabled.value !== 'true') {
      return null
    }

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const deviceInfo = parseUserAgent(userAgent)
    
    // Get location data
    const locationData = await getLocationFromIP(ipAddress)

    // For failed logins, we need to find or create a system user
    // First, try to find the user by email
    let systemUserId = null
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      })
      systemUserId = user?.id
    } catch (error) {
      // If user doesn't exist, we'll use a system user
    }

    // If no user found, use a system user ID or create a placeholder
    if (!systemUserId) {
      // Try to find a system user or create one for failed logins
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@failed-login.local' }
      })
      
      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            name: 'System (Failed Login)',
            email: 'system@failed-login.local',
            role: 'SYSTEM',
            isActive: false
          }
        })
      }
      systemUserId = systemUser.id
    }

    // Create the activity log for failed login
    const activityLog = await prisma.userActivityLog.create({
      data: {
        userId: systemUserId,
        activityType: 'LOGIN',
        ipAddress,
        userAgent,
        location: locationData as any, // Cast to any to satisfy Prisma Json type
        deviceInfo: deviceInfo as any, // Cast to any to satisfy Prisma Json type
        isSuccessful: false,
        failureReason: reason,
        metadata: {
          attemptedEmail: email,
          failureTime: new Date().toISOString(),
          isFailedLogin: true
        }
      }
    })

    return activityLog
  } catch (error) {
    console.error('Error logging failed login:', error)
    return null
  }
}

export async function logSessionTimeout(userId: string, request: NextRequest, sessionId?: string) {
  return logUserActivity({
    userId,
    activityType: 'SESSION_TIMEOUT',
    request,
    sessionId,
    isSuccessful: true,
    metadata: {
      timeoutTime: new Date().toISOString()
    }
  })
}

export async function logPasswordChange(userId: string, request: NextRequest) {
  return logUserActivity({
    userId,
    activityType: 'PASSWORD_CHANGE',
    request,
    isSuccessful: true,
    metadata: {
      changeTime: new Date().toISOString()
    }
  })
}

export async function logProfileUpdate(userId: string, request: NextRequest, changes: any) {
  return logUserActivity({
    userId,
    activityType: 'PROFILE_UPDATE',
    request,
    isSuccessful: true,
    metadata: {
      updateTime: new Date().toISOString(),
      changes
    }
  })
}
