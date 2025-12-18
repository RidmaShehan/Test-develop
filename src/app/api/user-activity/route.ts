import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const activityType = searchParams.get('activityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isSuccessful = searchParams.get('isSuccessful')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    // If user is not admin/administrator/developer, only show their own activities
    if (!isAdminRole(user.role)) {
      where.userId = user.id
    } else if (userId) {
      // Admins can filter by specific user
      where.userId = userId
    }

    // Admin-only: filter by role
    if (isAdminRole(user.role) && role) {
      where.user = { ...(where.user || {}), role }
    }

    
    if (activityType) {
      where.activityType = activityType
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }
    
    if (isSuccessful !== null && isSuccessful !== undefined) {
      where.isSuccessful = isSuccessful === 'true'
    }

    // Search (admin can search all, normal user searches within their own logs)
    if (search) {
      const q = search.trim()
      if (q) {
        where.OR = [
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { ipAddress: { contains: q } },
        ]
      }
    }

    const [activityLogs, totalCount] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
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
          timestamp: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.userActivityLog.count({ where })
    ])

    return NextResponse.json({
      activityLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching user activity logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Security: activity logs should be written server-side (via `logUserActivity`) to prevent spoofing/spam.
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
