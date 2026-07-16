import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { isAdminRole, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function findAccessibleTask(taskId: string, userId: string, role: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: true } } },
  })

  if (!task) return null

  const canAccess = isAdminRole(role) ||
    task.createdById === userId ||
    task.assignedToId === userId ||
    task.project?.members.some((member) => member.userId === userId)

  return canAccess ? task : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const task = await findAccessibleTask(id, user.id, user.role)

    if (!task) return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 })

    const [checklists, comments, timeEntries] = await Promise.all([
      prisma.taskChecklist.findMany({ where: { taskId: id }, orderBy: { order: 'asc' } }),
      prisma.taskComment.findMany({
        where: { taskId: id },
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.taskTimeEntry.findMany({
        where: { taskId: id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { startTime: 'desc' },
      }),
    ])

    const { getProjectUserRole } = await import('@/lib/project-permissions')
    const projectRole = task.projectId ? await getProjectUserRole(task.projectId, user.id, user.role) : null

    const trackedMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    return NextResponse.json({ checklists, comments, timeEntries, trackedMinutes, projectRole })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const task = await findAccessibleTask(id, user.id, user.role)
    if (!task) return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 })

    // Check project role permissions
    if (task.projectId) {
      const { getProjectUserRole } = await import('@/lib/project-permissions')
      const projectRole = await getProjectUserRole(task.projectId, user.id, user.role)
      if (projectRole === 'VIEWER') {
        return NextResponse.json({ error: 'Unauthorized. Viewers cannot modify task details, comment, or log time.' }, { status: 403 })
      }
    }

    const body = await request.json()
    const action = body?.action

    if (action === 'comment') {
      const content = typeof body.content === 'string' ? body.content.trim() : ''
      if (!content) return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 })

      const comment = await prisma.taskComment.create({
        data: { taskId: id, authorId: user.id, content },
        include: { author: { select: { id: true, name: true, email: true } } },
      })

      if (task.assignedToId && task.assignedToId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: task.assignedToId,
            type: 'SYSTEM',
            title: `New comment on: ${task.title}`,
            message: `${user.name} commented on a task assigned to you.`,
          },
        })
      }
      return NextResponse.json(comment, { status: 201 })
    }

    if (action === 'checklist') {
      const title = typeof body.title === 'string' ? body.title.trim() : ''
      if (!title) return NextResponse.json({ error: 'Checklist title is required.' }, { status: 400 })
      const order = await prisma.taskChecklist.count({ where: { taskId: id } })
      const checklist = await prisma.taskChecklist.create({ data: { taskId: id, title, order } })
      return NextResponse.json(checklist, { status: 201 })
    }

    if (action === 'time-entry') {
      const startTime = new Date(body.startTime)
      const endTime = body.endTime ? new Date(body.endTime) : null
      if (Number.isNaN(startTime.getTime()) || (endTime && Number.isNaN(endTime.getTime()))) {
        return NextResponse.json({ error: 'A valid start and end time are required.' }, { status: 400 })
      }
      if (endTime && endTime < startTime) {
        return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 })
      }
      const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : null
      const entry = await prisma.taskTimeEntry.create({
        data: {
          taskId: id,
          userId: user.id,
          description: typeof body.description === 'string' ? body.description.trim() || null : null,
          startTime,
          endTime,
          duration,
        },
      })
      return NextResponse.json(entry, { status: 201 })
    }

    return NextResponse.json({ error: 'Unsupported collaboration action.' }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const task = await findAccessibleTask(id, user.id, user.role)
    if (!task) return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 })

    // Check project role permissions
    if (task.projectId) {
      const { getProjectUserRole } = await import('@/lib/project-permissions')
      const projectRole = await getProjectUserRole(task.projectId, user.id, user.role)
      if (projectRole === 'VIEWER') {
        return NextResponse.json({ error: 'Unauthorized. Viewers cannot modify checklist items.' }, { status: 403 })
      }
    }

    const body = await request.json()
    if (body?.action !== 'checklist' || typeof body.checklistId !== 'string' || typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'A checklist id and completed state are required.' }, { status: 400 })
    }
    const checklist = await prisma.taskChecklist.updateMany({
      where: { id: body.checklistId, taskId: id },
      data: { completed: body.completed },
    })
    if (!checklist.count) return NextResponse.json({ error: 'Checklist item not found.' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
