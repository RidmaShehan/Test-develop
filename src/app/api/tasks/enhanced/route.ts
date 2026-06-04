import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole, AuthenticationError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit
    
    // Filter parameters
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const priority = searchParams.get('priority')

    const whereClause: Record<string, any> = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own tasks or tasks in their projects
    if (!isAdminRole(user.role)) {
      whereClause.OR = [
        { createdById: user.id },
        { assignedToId: user.id },
        { project: { members: { some: { userId: user.id } } } }
      ]
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (status) {
      whereClause.status = status
    }

    if (assignedTo) {
      whereClause.assignedToId = assignedTo
    }
    
    if (priority) {
      whereClause.priority = priority
    }

    // Get total count for pagination
    const total = await prisma.task.count({ where: whereClause })

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        parentTask: {
          select: { id: true, title: true }
        },
        subtasks: {
          select: { id: true, title: true, status: true }
        },
        checklists: {
          orderBy: { order: 'asc' }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            subtasks: true,
            checklists: true,
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Check if client wants paginated response (has page param) or simple array (backward compatible)
    const wantsPagination = searchParams.get('page') || searchParams.get('limit')
    
    if (wantsPagination) {
      // Return paginated response
      return NextResponse.json({
        tasks,
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
      return NextResponse.json(tasks)
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const {
      title,
      description,
      status = 'OPEN',
      priority = 'MEDIUM',
      dueDate,
      estimatedHours,
      projectId,
      assignedToId,
      parentTaskId,
      tags,
      checklists = []
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        projectId,
        assignedToId,
        parentTaskId,
        tags: tags ? JSON.stringify(tags) : null,
        createdById: user.id,
        checklists: {
          create: checklists.map((checklist: { title: string }, index: number) => ({
            title: checklist.title,
            order: index
          }))
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        parentTask: {
          select: { id: true, title: true }
        },
        checklists: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
