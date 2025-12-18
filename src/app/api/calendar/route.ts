import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'
import { FollowUpStatus } from '@prisma/client'

// GET /api/calendar - Get all calendar events (meetings, tasks, follow-ups)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Determine if user should see all data
    const isAdmin = isAdminRole(user.role)
    
    // Get date range from query params (optional)
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Fetch meetings
    const meetingWhere: any = {}
    if (!isAdmin) {
      meetingWhere.OR = [
        { createdById: user.id },
        { assignedToId: user.id }
      ]
    }
    if (Object.keys(dateFilter).length > 0) {
      meetingWhere.OR = [
        { startTime: dateFilter },
        { endTime: dateFilter }
      ]
    }

    const meetings = await prisma.meeting.findMany({
      where: meetingWhere,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Fetch follow-up tasks
    const taskWhere: any = {}
    if (!isAdmin) {
      taskWhere.assignedTo = user.id
    }
    if (Object.keys(dateFilter).length > 0) {
      taskWhere.dueAt = dateFilter
    }

    const tasks = await prisma.followUpTask.findMany({
      where: taskWhere,
      include: {
        seeker: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dueAt: 'asc'
      }
    })

    // Fetch regular tasks
    const regularTaskWhere: any = {}
    if (!isAdmin) {
      regularTaskWhere.assignedToId = user.id
    }
    if (Object.keys(dateFilter).length > 0) {
      regularTaskWhere.dueDate = dateFilter
    }

    const regularTasks = await prisma.task.findMany({
      where: regularTaskWhere,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Format events for calendar
    const events = [
      // Meetings
      ...meetings.map(meeting => ({
        id: meeting.id,
        type: 'meeting',
        title: meeting.title,
        start: meeting.startTime,
        end: meeting.endTime,
        allDay: false,
        color: getMeetingColor(meeting.status),
        description: meeting.description,
        location: meeting.location,
        meetingType: meeting.meetingType,
        meetingLink: meeting.meetingLink,
        assignedTo: meeting.assignedTo,
        createdBy: meeting.createdBy,
        seeker: meeting.seeker,
        status: meeting.status,
        raw: meeting
      })),
      
      // Follow-up tasks
      ...tasks.map(task => ({
        id: task.id,
        type: 'followup',
        title: task.seeker ? `Follow-up: ${task.seeker.fullName}` : 'Follow-up Task',
        start: task.dueAt,
        end: new Date(new Date(task.dueAt).getTime() + 60 * 60 * 1000), // 1 hour default
        allDay: false,
        color: getTaskColor(task.status),
        description: task.notes,
        purpose: task.purpose,
        assignedTo: task.user,
        seeker: task.seeker,
        status: task.status,
        isAutomatic: task.notes?.includes('Automatic follow-up') || false,
        raw: task
      })),
      
      // Regular tasks
      ...regularTasks
        .filter(task => task.dueDate) // Only tasks with due dates
        .map(task => ({
          id: task.id,
          type: 'task',
          title: task.title,
          start: task.dueDate!,
          end: new Date(new Date(task.dueDate!).getTime() + 60 * 60 * 1000), // 1 hour default
          allDay: false,
          color: getTaskColor(task.status),
          description: task.description,
          priority: task.priority,
          assignedTo: task.assignedTo,
          createdBy: task.createdBy,
          status: task.status,
          raw: task
        }))
    ]

    return NextResponse.json({
      events,
      meetings: meetings.length,
      tasks: tasks.length,
      regularTasks: regularTasks.length,
      total: events.length
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

function getMeetingColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return '#3b82f6' // blue
    case 'IN_PROGRESS':
      return '#f59e0b' // amber
    case 'COMPLETED':
      return '#10b981' // green
    case 'CANCELLED':
      return '#ef4444' // red
    case 'RESCHEDULED':
      return '#8b5cf6' // purple
    default:
      return '#6b7280' // gray
  }
}

function getTaskColor(status: string): string {
  switch (status) {
    case 'OPEN':
    case 'TODO':
      return '#f59e0b' // amber
    case 'IN_PROGRESS':
      return '#3b82f6' // blue
    case 'DONE':
    case 'COMPLETED':
      return '#10b981' // green
    case 'OVERDUE':
      return '#ef4444' // red
    case 'ON_HOLD':
      return '#f97316' // orange
    default:
      return '#6b7280' // gray
  }
}

