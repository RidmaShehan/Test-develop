import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'
import { logUserActivity } from '@/lib/activity-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) { 
  try {
    const _user = await requireAuth(request)
    
    const { id } = await params
    
    // Build where clause based on user role
    // Treat legacy rows where isDeleted might be NULL as "not deleted"
    const where: any = { id, NOT: { isDeleted: true } }
    
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }
    
    const seeker = await prisma.seeker.findFirst({
      where,
      include: {
        programInterest: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        promotionCode: {
          select: {
            id: true,
            code: true,
            discountAmountLKR: true,
          },
        },
        interactions: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        followUpTasks: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!seeker) {
      return NextResponse.json(
        { error: 'Seeker not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(seeker)
  } catch (error) {
    console.error('Error fetching seeker:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seeker' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const body = await request.json()
    const { id } = await params
    
    // Check if user has permission to update this inquiry
    const where: any = { id, NOT: { isDeleted: true } }
    
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }
    
    const existingSeeker = await prisma.seeker.findFirst({ where })
    
    if (!existingSeeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    // Never allow clients to spoof ownership/deletion fields or change contact phones (edit form locks these)
    const safeBody = { ...((body || {}) as Record<string, unknown>) }
    for (const key of [
      'createdById',
      'deletedById',
      'isDeleted',
      'deletedAt',
      'phone',
      'whatsappNumber',
      'whatsapp',
    ] as const) {
      delete safeBody[key]
    }

    const seeker = await prisma.seeker.update({
      where: {
        id,
      },
      data: safeBody,
      include: {
        programInterest: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })

    // Log activity: Inquiry updated
    try {
      await logUserActivity({
        userId: _user.id,
        activityType: 'UPDATE_INQUIRY',
        request,
        isSuccessful: true,
        metadata: {
          seekerId: id,
          seekerName: existingSeeker.fullName,
        },
      })
    } catch (logError) {
      console.error('Error logging inquiry update activity:', logError)
    }

    return NextResponse.json(seeker)
  } catch (error) {
    console.error('Error updating seeker:', error)
    return NextResponse.json(
      { error: 'Failed to update seeker' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const body = await request.json()
    const { id } = await params
    
    // Check if user has permission to update this inquiry
    const where: any = { id, NOT: { isDeleted: true } }
    
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }
    
    const existingSeeker = await prisma.seeker.findFirst({ where })
    
    if (!existingSeeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    // Handle relationships; strip phone / WhatsApp — not editable via inquiry edit
    const bodyPayload = body || {}
    const { preferredProgramIds, campaignId } = bodyPayload
    const dataToUpdate: any = { ...bodyPayload }
    delete dataToUpdate.preferredProgramIds
    delete dataToUpdate.campaignId
    delete dataToUpdate.phone
    delete dataToUpdate.whatsappNumber
    delete dataToUpdate.whatsapp
    
    // Handle preferred programs if provided
    if (preferredProgramIds !== undefined && Array.isArray(preferredProgramIds)) {
      // Delete existing preferred programs
      await prisma.seekerProgram.deleteMany({
        where: { seekerId: id }
      })
      
      // Create new preferred programs
      if (preferredProgramIds.length > 0) {
        await prisma.seekerProgram.createMany({
          data: preferredProgramIds.map((programId: string) => ({
            seekerId: id,
            programId
          }))
        })
      }
    }
    
    // Handle campaign relationship if provided
    if (campaignId !== undefined) {
      // Set the direct campaignId field
      dataToUpdate.campaignId = campaignId && campaignId.trim() !== '' ? campaignId : null
      
      // Also update the many-to-many campaign relationship
      // Delete existing campaign relationships
      await prisma.campaignSeeker.deleteMany({
        where: { seekerId: id }
      })
      
      // Create new campaign relationship if campaignId is provided and not empty
      if (campaignId && campaignId.trim() !== '') {
        await prisma.campaignSeeker.create({
          data: {
            seekerId: id,
            campaignId: campaignId
          }
        })
      }
    }
    
    // Update the seeker
    const seeker = await prisma.seeker.update({
      where: { id },
      data: dataToUpdate,
      include: {
        programInterest: true,
        preferredPrograms: {
          include: {
            program: true
          }
        },
        campaigns: {
          include: {
            campaign: true
          }
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })

    // Handle status-based task automation using service layer
    const { handleStatusChange, normalizeStatus, isFinalStatus } = await import('@/lib/seeker-status-service')
    
    // Legacy: If registerNow is set to true, update status to REGISTERED
    if (dataToUpdate.registerNow === true) {
      dataToUpdate.stage = 'REGISTERED'
    }
    
    // Normalize the status if it's being updated
    if (dataToUpdate.stage) {
      dataToUpdate.stage = normalizeStatus(dataToUpdate.stage)
    }
    
    // If status is being changed to a final status, handle task automation
    const oldStatus = existingSeeker.stage
    const newStatus = dataToUpdate.stage || oldStatus
    
    if (newStatus !== oldStatus && isFinalStatus(newStatus)) {
      try {
        const result = await handleStatusChange(
          id,
          newStatus,
          _user.id,
          oldStatus,
          body.rejectionReason
        )
        if (result.tasksCompleted > 0) {
          console.log(`Status change automation: ${result.message}`)
        }
      } catch (statusError) {
        console.error('Error handling status-based task completion:', statusError)
        // Don't fail the request if status handling fails
      }
    }

    // Log activity: Inquiry updated
    try {
      await logUserActivity({
        userId: _user.id,
        activityType: 'UPDATE_INQUIRY',
        request,
        isSuccessful: true,
        metadata: {
          seekerId: id,
          seekerName: existingSeeker.fullName,
        },
      })
    } catch (logError) {
      console.error('Error logging inquiry update activity:', logError)
    }

    return NextResponse.json(seeker)
  } catch (error) {
    console.error('Error updating seeker:', error)
    return NextResponse.json(
      { error: 'Failed to update seeker' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { id } = await params
    
    // Check if user has permission to delete this inquiry
    const where: any = { id, NOT: { isDeleted: true } }
    
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }
    
    const existingSeeker = await prisma.seeker.findFirst({ where })
    
    if (!existingSeeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    await prisma.seeker.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: _user.id,
      },
    })

    // Log activity: Inquiry deleted (moved to trash)
    try {
      await logUserActivity({
        userId: _user.id,
        activityType: 'DELETE_INQUIRY',
        request,
        isSuccessful: true,
        metadata: {
          seekerId: id,
          seekerName: existingSeeker.fullName,
        },
      })
    } catch (logError) {
      console.error('Error logging inquiry delete activity:', logError)
    }

    return NextResponse.json({ message: 'Inquiry moved to trash successfully' })
  } catch (error) {
    console.error('Error deleting seeker:', error)
    return NextResponse.json(
      { error: 'Failed to delete seeker' },
      { status: 500 }
    )
  }
}