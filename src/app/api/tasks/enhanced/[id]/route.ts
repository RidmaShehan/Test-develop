import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

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

    // Check permissions: Admin/Administrator can update any task, others must be creator, assignee, or project member
    const isAdmin = isAdminRole(user.role)
    const hasPermission = isAdmin ||
      existingTask.createdById === user.id ||
      existingTask.assignedToId === user.id ||
      existingTask.project?.members.some(m => m.userId === user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
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
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

