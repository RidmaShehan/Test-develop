import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
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
    return handleApiError(error)
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

    // A task may only be created in a project the user can access and has correct permissions on.
    let projectMemberIds: string[] | null = null
    let canAssignProjectTasks = false

    if (projectId) {
      const { getProjectUserRole } = await import('@/lib/project-permissions')
      const projectRole = await getProjectUserRole(projectId, user.id, user.role)

      if (!projectRole) {
        return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 403 })
      }

      if (projectRole === 'VIEWER') {
        return NextResponse.json({ error: 'Unauthorized. Viewers cannot create tasks in a project.' }, { status: 403 })
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { members: { select: { userId: true } } },
      })
      projectMemberIds = project?.members.map((member) => member.userId) || []
      
      // Project OWNER and MANAGER can create and assign tasks.
      // CONTRIBUTORS can only create unassigned or self-assigned tasks.
      canAssignProjectTasks = projectRole === 'OWNER' || projectRole === 'MANAGER'
    } else {
      // Personal task (outside any project)
      canAssignProjectTasks = true
    }

    // Only project OWNER/MANAGER or Admin can assign tasks to another employee.
    if (assignedToId && assignedToId !== user.id && !canAssignProjectTasks) {
      return NextResponse.json(
        { error: 'Only a project owner, manager, or administrator can assign this task to another employee.' },
        { status: 403 }
      )
    }

    if (assignedToId && projectMemberIds && !projectMemberIds.includes(assignedToId) && assignedToId !== user.id) {
      return NextResponse.json({ error: 'Tasks can only be assigned to project members.' }, { status: 400 })
    }

    if (assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedToId, isActive: true },
        select: { id: true },
      })
      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found or inactive.' }, { status: 400 })
      }
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
    return handleApiError(error)
  }
}
