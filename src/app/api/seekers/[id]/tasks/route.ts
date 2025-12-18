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

    // Enforce RBAC: non-admins can only view tasks for seekers they created
    const seekerWhere: any = { id, NOT: { isDeleted: true } }
    if (!isAdminRole(_user.role)) {
      seekerWhere.createdById = _user.id
    }

    const seeker = await prisma.seeker.findFirst({ where: seekerWhere, select: { id: true } })
    if (!seeker) {
      return NextResponse.json(
        { error: 'Seeker not found or access denied' },
        { status: 404 }
      )
    }
    
    const tasks = await prisma.followUpTask.findMany({
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
        dueAt: 'asc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
