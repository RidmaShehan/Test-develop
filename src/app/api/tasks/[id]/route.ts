import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

// GET individual follow-up task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params

    const task = await prisma.followUpTask.findUnique({
      where: { id },
      include: {
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdById: true,
            registerNow: true,
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

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this task
    if (!isAdminRole(_user.role)) {
      if (task.assignedTo !== _user.id && task.seeker.createdById !== _user.id) {
        return NextResponse.json(
          { error: 'Access denied. You can only view tasks assigned to you for inquiries you created.' },
          { status: 403 }
        )
      }
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
    const _user = await requireAuth(request)
    const body = await request.json()
    const { status, notes, registerNow, action } = body
    const { id } = await params

    // Get the current task to track the status change (include notes for clothing station logic)
    const currentTask = await prisma.followUpTask.findUnique({
      where: { id },
      select: { 
        status: true,
        notes: true,
        assignedTo: true,
        seekerId: true,
        seeker: {
          select: {
            id: true,
            createdById: true,
            registerNow: true
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

    // Handle clothing station queue actions (Registration / Not Interested)
    if (action === 'register_clothing_station' || action === 'not_interested_clothing_station') {
      const isRegistration = action === 'register_clothing_station'
      const note = isRegistration
        ? 'Registered by clothing station queue'
        : 'Not interested - clothing station queue'

      // Extract follow-up number from notes (e.g. "Automatic follow-up #1" -> 1)
      const followUpMatch = (currentTask.notes || '').match(/#(\d+)/)
      const currentFollowUpNum = followUpMatch ? parseInt(followUpMatch[1], 10) : null

      // Tasks to complete: current + next (#2) if current is #1
      const taskIdsToComplete: string[] = [id]
      if (currentFollowUpNum === 1) {
        const task2 = await prisma.followUpTask.findFirst({
          where: {
            seekerId: currentTask.seekerId,
            id: { not: id },
            status: { not: 'COMPLETED' },
            notes: { contains: '#2' }
          },
          select: { id: true }
        })
        if (task2) taskIdsToComplete.push(task2.id)
      }

      // Update seeker
      if (isRegistration) {
        await prisma.seeker.update({
          where: { id: currentTask.seekerId },
          data: { registerNow: true }
        })
      } else {
        await prisma.seeker.update({
          where: { id: currentTask.seekerId },
          data: { stage: 'LOST' }
        })
      }

      // Complete all target tasks with note
      for (const taskId of taskIdsToComplete) {
        const t = await prisma.followUpTask.findUnique({ where: { id: taskId }, select: { status: true, notes: true } })
        if (!t) continue
        const appendedNote = t.status !== 'COMPLETED' ? (t.notes ? `${t.notes}\n${note}` : note) : undefined
        await prisma.followUpTask.update({
          where: { id: taskId },
          data: {
            status: 'COMPLETED',
            ...(appendedNote && { notes: appendedNote })
          }
        })
        await prisma.taskActionHistory.create({
          data: {
            taskId,
            fromStatus: t.status,
            toStatus: 'COMPLETED',
            actionBy: _user.id,
            notes: note
          }
        })
      }

      const updatedTask = await prisma.followUpTask.findUnique({
        where: { id },
        include: {
          seeker: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              createdById: true,
              registerNow: true
            }
          },
          user: { select: { name: true } },
          actionHistory: {
            include: { user: { select: { name: true } } },
            orderBy: { actionAt: 'desc' }
          }
        }
      })
      return NextResponse.json(updatedTask)
    }

    // Update the task status (standard flow)
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
            registerNow: true,
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

    // Update seeker's registerNow field if registerNow is provided
    if (registerNow !== undefined && currentTask.seekerId) {
      const isRegistering = registerNow === true || registerNow === 'true'
      
      await prisma.seeker.update({
        where: { id: currentTask.seekerId },
        data: { registerNow: isRegistering }
      })
      
      // Update the response to reflect the change
      ;(updatedTask.seeker as any).registerNow = isRegistering
      
      // If registering, automatically move this task and all other tasks for the same seeker to COMPLETED
      if (isRegistering) {
        // Find all tasks for this seeker
        const allSeekerTasks = await prisma.followUpTask.findMany({
          where: {
            seekerId: currentTask.seekerId,
            status: { not: 'COMPLETED' } // Only update tasks that aren't already completed
          },
          select: { id: true, status: true }
        })
        
        // Update all tasks to COMPLETED
        await Promise.all(
          allSeekerTasks.map(async (task) => {
            await prisma.followUpTask.update({
              where: { id: task.id },
              data: { status: 'COMPLETED' }
            })
            
            // Create action history for each task
            await prisma.taskActionHistory.create({
              data: {
                taskId: task.id,
                fromStatus: task.status,
                toStatus: 'COMPLETED',
                actionBy: _user.id,
                notes: `Task automatically completed - Seeker registered (registerNow=true)`
              }
            })
          })
        )
        
        // Update the current task status in the response
        updatedTask.status = 'COMPLETED'
      }
    }

    // Create action history entry
    const historyNotes = notes || 
      (registerNow !== undefined 
        ? `Status changed to ${status}. Registration marked as ${registerNow ? 'Yes' : 'No'}.`
        : `Status changed from ${currentTask.status} to ${status}`)
    
    await prisma.taskActionHistory.create({
      data: {
        taskId: id,
        fromStatus: currentTask.status,
        toStatus: status,
        actionBy: _user.id,
        notes: historyNotes,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE follow-up task (soft delete - mark as deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params

    // Get the current task to check permissions
    const currentTask = await prisma.followUpTask.findUnique({
      where: { id },
      select: { 
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

    // Check if user has permission to delete this task
    if (!isAdminRole(_user.role)) {
      // Non-admin users can only delete tasks assigned to them for inquiries they created
      if (currentTask.assignedTo !== _user.id || currentTask.seeker.createdById !== _user.id) {
        return NextResponse.json(
          { error: 'Access denied. You can only delete tasks assigned to you for inquiries you created.' },
          { status: 403 }
        )
      }
    }

    // Soft delete: Update status to a deleted state or add deletedAt field
    // For now, we'll hard delete. In production, consider soft delete:
    // await prisma.followUpTask.update({
    //   where: { id },
    //   data: { deletedAt: new Date(), deletedBy: _user.id }
    // })

    await prisma.followUpTask.delete({
      where: { id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    })
  } catch (error) {
    return handleApiError(error)
  }
}