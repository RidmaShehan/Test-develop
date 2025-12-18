import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params

    // Enforce RBAC: non-admins can only access interactions for inquiries they created
    const seekerWhere: any = { id, NOT: { isDeleted: true } }
    if (!isAdminRole(_user.role)) {
      seekerWhere.createdById = _user.id
    }
    const seeker = await prisma.seeker.findFirst({ where: seekerWhere, select: { id: true } })
    if (!seeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    const interactions = await prisma.interaction.findMany({
      where: {
        seekerId: id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(interactions)
  } catch (error) {
    console.error('Error fetching interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params
    
    const body = await request.json()

    // Enforce RBAC: non-admins can only create interactions for inquiries they created
    const seekerWhere: any = { id, NOT: { isDeleted: true } }
    if (!isAdminRole(_user.role)) {
      seekerWhere.createdById = _user.id
    }
    const seeker = await prisma.seeker.findFirst({ where: seekerWhere, select: { id: true } })
    if (!seeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    const interaction = await prisma.interaction.create({
      data: {
        ...body,
        seekerId: id,
        userId: _user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    // Auto-create follow-up task based on outcome
    if (body.outcome === 'NO_ANSWER') {
      await prisma.followUpTask.create({
        data: {
          seekerId: id,
          assignedTo: _user.id,
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          purpose: 'CALLBACK',
          notes: 'Follow up on missed call',
        },
      })
    }

    return NextResponse.json(interaction, { status: 201 })
  } catch (error) {
    console.error('Error creating interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    )
  }
}
