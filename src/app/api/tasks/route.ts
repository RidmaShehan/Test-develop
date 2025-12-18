import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show tasks assigned to the current user
    if (!isAdminRole(_user.role)) {
      where.assignedTo = _user.id
    }
    
    const tasks = await prisma.followUpTask.findMany({
      where,
      include: {
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdById: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        actionHistory: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            actionAt: 'desc',
          },
        },
      },
      orderBy: {
        dueAt: 'asc',
      },
    })

    // For non-admin users, filter to only show tasks for inquiries created by the current user
    const userTasks = isAdminRole(_user.role)
      ? tasks 
      : tasks.filter(task => task.seeker.createdById === _user.id)

    return NextResponse.json(userTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
