import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole, AuthenticationError } from '@/lib/auth'

// GET /api/campaigns/trash - Get all soft-deleted campaigns
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const where: Record<string, unknown> = {
      isDeleted: true,
    }

    // Non-admin users only see their own deleted campaigns
    if (!isAdminRole(user.role)) {
      where.createdById = user.id
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        campaignType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            seekers: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return handleApiError(error)
  }
}
