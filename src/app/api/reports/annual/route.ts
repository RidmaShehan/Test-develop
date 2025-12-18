import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only ADMIN/ADMINISTRATOR/DEVELOPER can view reports
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month')

    // Build date range
    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1)
    const endDate = new Date(year, month ? parseInt(month) : 12, 0, 23, 59, 59)

    // Get all activity logs for the period
    const activityLogs = await prisma.userActivityLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Calculate metrics
    const loginLogs = activityLogs.filter(log => log.activityType === 'LOGIN' && log.isSuccessful)
    const logoutLogs = activityLogs.filter(log => log.activityType === 'LOGOUT')
    const uniqueUsers = new Set(loginLogs.map(log => log.userId)).size

    // Calculate average session duration
    const userSessions = new Map<string, { loginTime: Date; logoutTime?: Date }>()
    let totalSessionDuration = 0
    let sessionCount = 0

    for (const log of activityLogs) {
      if (log.activityType === 'LOGIN' && log.isSuccessful) {
        userSessions.set(log.userId, { loginTime: log.timestamp })
      } else if (log.activityType === 'LOGOUT') {
        const session = userSessions.get(log.userId)
        if (session && !session.logoutTime) {
          session.logoutTime = log.timestamp
          const duration = session.logoutTime.getTime() - session.loginTime.getTime()
          totalSessionDuration += duration
          sessionCount++
        }
      }
    }

    const averageSessionDuration = sessionCount > 0 ? totalSessionDuration / sessionCount / (1000 * 60) : 0

    // Top countries
    const countryCounts = new Map<string, number>()
    activityLogs.forEach(log => {
      const location = log.location ? (typeof log.location === 'string' ? JSON.parse(log.location) : log.location) : null
      if (location?.country) {
        const country = location.country as string
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1)
      }
    })
    const topCountries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top devices
    const deviceCounts = new Map<string, number>()
    activityLogs.forEach(log => {
      const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
      if (deviceInfo?.device) {
        const device = deviceInfo.device as string
        deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1)
      }
    })
    const topDevices = Array.from(deviceCounts.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top browsers
    const browserCounts = new Map<string, number>()
    activityLogs.forEach(log => {
      const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
      if (deviceInfo?.browser) {
        const browser = deviceInfo.browser as string
        browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1)
      }
    })
    const topBrowsers = Array.from(browserCounts.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Login trends by day
    const dailyCounts = new Map<string, { logins: number; logouts: number }>()
    activityLogs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0]
      if (!dailyCounts.has(date)) {
        dailyCounts.set(date, { logins: 0, logouts: 0 })
      }
      const counts = dailyCounts.get(date)!
      if (log.activityType === 'LOGIN' && log.isSuccessful) {
        counts.logins++
      } else if (log.activityType === 'LOGOUT') {
        counts.logouts++
      }
    })
    const loginTrends = Array.from(dailyCounts.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // User activity summary
    const userActivityMap = new Map<string, {
      userId: string
      userName: string
      userEmail: string
      userRole: string
      totalLogins: number
      totalLogouts: number
      lastLogin?: Date
      lastLogout?: Date
      sessions: Array<{ loginTime: Date; logoutTime?: Date }>
    }>()

    activityLogs.forEach(log => {
      if (!userActivityMap.has(log.userId)) {
        userActivityMap.set(log.userId, {
          userId: log.userId,
          userName: log.user.name,
          userEmail: log.user.email,
          userRole: log.user.role,
          totalLogins: 0,
          totalLogouts: 0,
          sessions: []
        })
      }
      const userActivity = userActivityMap.get(log.userId)!

      if (log.activityType === 'LOGIN' && log.isSuccessful) {
        userActivity.totalLogins++
        userActivity.lastLogin = log.timestamp
        userActivity.sessions.push({ loginTime: log.timestamp })
      } else if (log.activityType === 'LOGOUT') {
        userActivity.totalLogouts++
        userActivity.lastLogout = log.timestamp
        // Find the most recent session and set logout time
        const recentSession = userActivity.sessions[userActivity.sessions.length - 1]
        if (recentSession && !recentSession.logoutTime) {
          recentSession.logoutTime = log.timestamp
        }
      }
    })

    const userActivity = Array.from(userActivityMap.values()).map(user => {
      const sessionDurations = user.sessions
        .filter(session => session.logoutTime)
        .map(session => session.logoutTime!.getTime() - session.loginTime.getTime())
      
      const averageSessionDuration = sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length / (1000 * 60)
        : 0

      return {
        ...user,
        lastLogin: user.lastLogin?.toISOString(),
        lastLogout: user.lastLogout?.toISOString(),
        averageSessionDuration
      }
    })

    return NextResponse.json({
      totalLogins: loginLogs.length,
      totalLogouts: logoutLogs.length,
      uniqueUsers,
      averageSessionDuration: Math.round(averageSessionDuration),
      topCountries,
      topDevices,
      topBrowsers,
      loginTrends,
      userActivity
    })
  } catch (error) {
    console.error('Error generating annual report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
