import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

// GET individual task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true },
          include: {
            members: true
          }
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
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isAdmin = isAdminRole(user.role)
    const hasPermission = isAdmin ||
      task.createdById === user.id ||
      task.assignedToId === user.id ||
      task.project?.members.some(m => m.userId === user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { id } = await params
    
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedToId,
      projectId,
    } = body

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check project-level roles
    const { getProjectUserRole } = await import('@/lib/project-permissions')
    const projectIdVal = existingTask.projectId
    let projectRole = null
    if (projectIdVal) {
      projectRole = await getProjectUserRole(projectIdVal, user.id, user.role)
    }

    const isAdmin = isAdminRole(user.role)

    // Enforce role-based restrictions
    if (!isAdmin) {
      if (projectIdVal && !projectRole) {
        return NextResponse.json({ error: 'Unauthorized. You are not a member of this project.' }, { status: 403 })
      }

      if (projectRole === 'VIEWER') {
        return NextResponse.json({ error: 'Unauthorized. Viewers cannot update tasks.' }, { status: 403 })
      }

      if (projectRole === 'CONTRIBUTOR') {
        const isAssigned = existingTask.assignedToId === user.id || existingTask.createdById === user.id
        if (!isAssigned) {
          return NextResponse.json(
            { error: 'Unauthorized. Contributors can only update tasks assigned to or created by them.' },
            { status: 403 }
          )
        }

        // Contributors are only allowed to update status, progress or checklists.
        // Restrict modifications to title, description, priority, dueDate, assignee, or projectId.
        const tryingToUpdateRestrictedFields =
          title !== undefined ||
          description !== undefined ||
          priority !== undefined ||
          dueDate !== undefined ||
          assignedToId !== undefined ||
          projectId !== undefined

        if (tryingToUpdateRestrictedFields) {
          return NextResponse.json(
            { error: 'Unauthorized. Contributors can only update task status or progress.' },
            { status: 403 }
          )
        }
      }
    }

    const effectiveProjectId = projectId !== undefined ? projectId : existingTask.projectId
    const effectiveProject = effectiveProjectId
      ? await prisma.project.findUnique({
          where: { id: effectiveProjectId },
          select: { id: true, createdById: true, members: { select: { userId: true } } },
        })
      : null

    if (effectiveProjectId && !effectiveProject) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 400 })
    }

    const canAssign = isAdmin || effectiveProject?.createdById === user.id
    // Only the project owner or an administrator can assign another employee.
    if (assignedToId !== undefined && assignedToId !== null && assignedToId !== user.id && !canAssign) {
      return NextResponse.json(
        { error: 'Only a project owner or administrator can assign this task to another employee.' },
        { status: 403 }
      )
    }

    if (assignedToId && effectiveProject && !effectiveProject.members.some((member) => member.userId === assignedToId)) {
      return NextResponse.json({ error: 'Tasks can only be assigned to project members.' }, { status: 400 })
    }

    if (assignedToId) {
      const assignee = await prisma.user.findFirst({ where: { id: assignedToId, isActive: true }, select: { id: true } })
      if (!assignee) return NextResponse.json({ error: 'Assignee not found or inactive.' }, { status: 400 })
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
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

    return NextResponse.json(updatedTask)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check permissions: Admin/Administrator, project Owner, or task creator can delete tasks
    const { getProjectUserRole } = await import('@/lib/project-permissions')
    const projectRole = existingTask.projectId ? await getProjectUserRole(existingTask.projectId, user.id, user.role) : null
    
    const isAdmin = isAdminRole(user.role)
    const isOwner = projectRole === 'OWNER'
    const isCreator = existingTask.createdById === user.id

    if (!isAdmin && !isOwner && !isCreator) {
      return NextResponse.json(
        { error: 'Unauthorized. Only project Owners, task creators, and admins can delete tasks.' },
        { status: 403 }
      )
    }

    // Delete related records first (cascade delete)
    await prisma.$transaction([
      // Delete time entries
      prisma.taskTimeEntry.deleteMany({
        where: { taskId: id }
      }),
      // Delete comments
      prisma.taskComment.deleteMany({
        where: { taskId: id }
      }),
      // Delete attachments
      prisma.taskAttachment.deleteMany({
        where: { taskId: id }
      }),
      // Delete checklists
      prisma.taskChecklist.deleteMany({
        where: { taskId: id }
      }),
      // Update subtasks to remove parent reference
      prisma.task.updateMany({
        where: { parentTaskId: id },
        data: { parentTaskId: null }
      }),
      // Finally delete the task
      prisma.task.delete({
        where: { id }
      })
    ])

    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    })
  } catch (error) {
    return handleApiError(error)
  }
}
