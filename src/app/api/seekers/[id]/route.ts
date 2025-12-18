import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params
    
    const body = await request.json()

    // Enforce RBAC: non-admins can only update their own (non-deleted) seekers
    const where: any = { id, NOT: { isDeleted: true } }
    if (!isAdminRole(_user.role)) {
      where.createdById = _user.id
    }

    const existing = await prisma.seeker.findFirst({ where })
    if (!existing) {
      return NextResponse.json(
        { error: 'Seeker not found or access denied' },
        { status: 404 }
      )
    }

    // Never allow clients to spoof ownership/deletion fields
    const {
      createdById: _ignoredCreatedById,
      deletedById: _ignoredDeletedById,
      isDeleted: _ignoredIsDeleted,
      deletedAt: _ignoredDeletedAt,
      ...safeBody
    } = (body || {}) as Record<string, unknown>
    
    const seeker = await prisma.seeker.update({
      where: {
        id: id,
      },
      data: safeBody,
      include: {
        programInterest: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(seeker)
  } catch (error) {
    console.error('Error updating seeker:', error)
    return NextResponse.json(
      { error: 'Failed to update seeker' },
      { status: 500 }
    )
  }
}
