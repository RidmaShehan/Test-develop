import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const limit = parseInt(searchParams.get('limit') || '50')

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    const isAdmin = isAdminRole(user.role)

    // Get recent activities from various sources
    const activities: any[] = []

    // Task activities
    const recentTasks = await prisma.task.findMany({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { createdById: user.id },
                { assignedToId: user.id },
                { project: { members: { some: { userId: user.id } } } },
              ],
            }),
        updatedAt: { gte: sinceDate }
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    })

    recentTasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        type: 'TASK_UPDATED',
        title: 'Task Updated',
        description: `Task "${task.title}" was updated`,
        timestamp: task.updatedAt,
        userId: task.assignedToId || task.createdById,
        userName: (task.assignedTo || task.createdBy).name,
        userEmail: (task.assignedTo || task.createdBy).email,
        entityType: 'task',
        entityId: task.id,
        entityName: task.title
      })
    })

    // Project activities
    const recentProjects = await prisma.project.findMany({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { createdById: user.id },
                { members: { some: { userId: user.id } } },
              ],
            }),
        updatedAt: { gte: sinceDate }
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    })

    recentProjects.forEach(project => {
      activities.push({
        id: `project-${project.id}`,
        type: 'PROJECT_UPDATED',
        title: 'Project Updated',
        description: `Project "${project.name}" was updated`,
        timestamp: project.updatedAt,
        userId: project.createdById,
        userName: project.createdBy.name,
        userEmail: project.createdBy.email,
        entityType: 'project',
        entityId: project.id,
        entityName: project.name
      })
    })

    // Deal activities
    const recentDeals = await prisma.deal.findMany({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { createdById: user.id },
                { assignedToId: user.id },
                { project: { members: { some: { userId: user.id } } } },
              ],
            }),
        updatedAt: { gte: sinceDate }
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    })

    recentDeals.forEach(deal => {
      activities.push({
        id: `deal-${deal.id}`,
        type: 'DEAL_UPDATED',
        title: 'Deal Updated',
        description: `Deal "${deal.title}" was updated`,
        timestamp: deal.updatedAt,
        userId: deal.assignedToId || deal.createdById,
        userName: (deal.assignedTo || deal.createdBy).name,
        userEmail: (deal.assignedTo || deal.createdBy).email,
        entityType: 'deal',
        entityId: deal.id,
        entityName: deal.title
      })
    })

    // Meeting activities
    const recentMeetings = await prisma.meeting.findMany({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [{ createdById: user.id }, { assignedToId: user.id }],
            }),
        updatedAt: { gte: sinceDate }
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    })

    recentMeetings.forEach(meeting => {
      activities.push({
        id: `meeting-${meeting.id}`,
        type: 'MEETING_UPDATED',
        title: 'Meeting Updated',
        description: `Meeting "${meeting.title}" was updated`,
        timestamp: meeting.updatedAt,
        userId: meeting.assignedToId || meeting.createdById,
        userName: (meeting.assignedTo || meeting.createdBy).name,
        userEmail: (meeting.assignedTo || meeting.createdBy).email,
        entityType: 'meeting',
        entityId: meeting.id,
        entityName: meeting.title
      })
    })

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(activities.slice(0, limit))
  } catch (error) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    )
  }
}
