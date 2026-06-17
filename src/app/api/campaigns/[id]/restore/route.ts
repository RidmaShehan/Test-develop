import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole, AuthenticationError } from '@/lib/auth'

// POST /api/campaigns/[id]/restore - Restore a soft-deleted campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const existing = await prisma.campaign.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!existing.isDeleted) {
      return NextResponse.json(
        { error: 'Campaign is not deleted' },
        { status: 400 }
      )
    }

    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && existing.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to restore this campaign' },
        { status: 403 }
      )
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        campaignType: {
          select: { id: true, name: true, color: true, icon: true },
        },
        _count: {
          select: { seekers: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Campaign restored successfully',
      campaign,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return handleApiError(error)
  }
}
