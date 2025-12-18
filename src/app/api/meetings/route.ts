import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own meetings or assigned meetings
    if (!isAdminRole(user.role)) {
      where.OR = [
        { createdById: user.id },
        { assignedToId: user.id }
      ]
    }
    
    const meetings = await prisma.meeting.findMany({
      where,
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
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
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
      location, 
      notes, 
      startTime, 
      endTime, 
      assignedToId,
      meetingType,
      meetingLink,
      meetingId,
      meetingPassword,
      agenda,
      attendees
    } = body

    // Validate required fields
    if (!title || !startTime || !endTime || !assignedToId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startTime, endTime, assignedToId' },
        { status: 400 }
      )
    }

    // Validate assigned user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId }
    })
    
    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      )
    }


    // Check for time conflicts
    const conflictingMeeting = await prisma.meeting.findFirst({
      where: {
        assignedToId,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } }
            ]
          }
        ]
      }
    })

    if (conflictingMeeting) {
      return NextResponse.json(
        { error: 'Time conflict: Another meeting is scheduled during this time' },
        { status: 409 }
      )
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        location,
        notes,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        createdById: user.id,
        assignedToId,
        meetingType: meetingType || 'IN_PERSON',
        meetingLink,
        meetingId,
        meetingPassword,
        agenda,
        attendees
      },
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
      }
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
