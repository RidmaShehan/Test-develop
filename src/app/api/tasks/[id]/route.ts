import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const body = await request.json()
    const { status, notes } = body
    const { id } = await params

    // Get the current task to track the status change
    const currentTask = await prisma.followUpTask.findUnique({
      where: { id },
      select: { 
        status: true,
        assignedTo: true,
        seeker: {
          select: {
            createdById: true
          }
        }
      }
    })

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this task
    if (!isAdminRole(_user.role)) {
      // Non-admin users can only update tasks assigned to them for inquiries they created
      if (currentTask.assignedTo !== _user.id || currentTask.seeker.createdById !== _user.id) {
        return NextResponse.json(
          { error: 'Access denied. You can only update tasks assigned to you for inquiries you created.' },
          { status: 403 }
        )
      }
    }

    // Update the task status
    const updatedTask = await prisma.followUpTask.update({
      where: { id },
      data: { status },
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
    })

    // Create action history entry
    await prisma.taskActionHistory.create({
      data: {
        taskId: id,
        fromStatus: currentTask.status,
        toStatus: status,
        actionBy: _user.id,
        notes: notes || `Status changed from ${currentTask.status} to ${status}`,
      },
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