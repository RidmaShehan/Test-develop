import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const meeting = await prisma.meeting.findUnique({
      where: { id },
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
            phone: true,
            email: true
          }
        }
      }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this meeting
    if (!isAdminRole(user.role) && meeting.createdById !== user.id && meeting.assignedToId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this meeting' },
        { status: 403 }
      )
    }

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    
    const { 
      title, 
      description, 
      location, 
      notes, 
      startTime, 
      endTime, 
      assignedToId, 
      status,
      meetingType,
      meetingLink,
      meetingId,
      meetingPassword,
      agenda,
      attendees
    } = body

    // Check if meeting exists
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this meeting
    if (!isAdminRole(user.role) && existingMeeting.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this meeting' },
        { status: 403 }
      )
    }

    // Validate assigned user exists if provided
    if (assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      })
      
      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        )
      }
    }


    // Check for time conflicts (excluding current meeting)
    if (startTime && endTime) {
      const conflictingMeeting = await prisma.meeting.findFirst({
        where: {
          id: { not: id },
          assignedToId: assignedToId || existingMeeting.assignedToId,
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
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (location !== undefined) updateData.location = location
    if (notes !== undefined) updateData.notes = notes
    if (startTime !== undefined) updateData.startTime = new Date(startTime)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (status !== undefined) updateData.status = status
    if (meetingType !== undefined) updateData.meetingType = meetingType
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink
    if (meetingId !== undefined) updateData.meetingId = meetingId
    if (meetingPassword !== undefined) updateData.meetingPassword = meetingPassword
    if (agenda !== undefined) updateData.agenda = agenda
    if (attendees !== undefined) updateData.attendees = attendees

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
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
            phone: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete this meeting
    if (!isAdminRole(user.role) && meeting.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this meeting' },
        { status: 403 }
      )
    }

    await prisma.meeting.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Meeting deleted successfully' })
  } catch (error) {
    console.error('Error deleting meeting:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}
