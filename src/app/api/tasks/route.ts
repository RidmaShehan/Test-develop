import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole, AuthenticationError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit
    
    // Filter parameters
    const status = searchParams.get('status')
    const purpose = searchParams.get('purpose')
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show tasks assigned to the current user
    if (!isAdminRole(_user.role)) {
      where.assignedTo = _user.id
    }
    
    // Add filter parameters
    if (status) {
      where.status = status
    }
    if (purpose) {
      where.purpose = purpose
    }
    
    // Get total count for pagination
    const total = await prisma.followUpTask.count({ where })
    
    const tasks = await prisma.followUpTask.findMany({
      where,
      include: {
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdById: true,
            registerNow: true,
            stage: true,
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
      skip,
      take: limit,
    })

    // For non-admin users, filter to only show tasks for inquiries created by the current user
    const userTasks = isAdminRole(_user.role)
      ? tasks 
      : tasks.filter(task => task.seeker.createdById === _user.id)

    // Check if client wants paginated response (has page param) or simple array (backward compatible)
    const wantsPagination = searchParams.get('page') || searchParams.get('limit')
    
    if (wantsPagination) {
      // Return paginated response
      return NextResponse.json({
        tasks: userTasks,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      })
    } else {
      // Return simple array for backward compatibility (no pagination params = all tasks)
      return NextResponse.json(userTasks)
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
