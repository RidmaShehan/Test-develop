import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const logs = await prisma.userActivityLog.findMany({
      where: {
        activityType: { in: ['DATA_BACKUP', 'SCHEMA_EXPORT'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json({ history: logs })
  } catch (err) {
    return handleApiError(err)
  }
}
