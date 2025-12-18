import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
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
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own inquiries
    if (!isAdminRole(_user.role)) {
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
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only allow updating own inquiries
    if (!isAdminRole(_user.role)) {
      where.createdById = _user.id
    }
    
    const existingSeeker = await prisma.seeker.findFirst({ where })
    
    if (!existingSeeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    // Never allow clients to spoof ownership/deletion fields
    const {
      createdById: _ignoredCreatedById,
      deletedById: _ignoredDeletedById,
      isDeleted: _ignoredIsDeleted,
      deletedAt: _ignoredDeletedAt,
      ...safeBody
    } = (body || {}) as Record<string, unknown>

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
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only allow updating own inquiries
    if (!isAdminRole(_user.role)) {
      where.createdById = _user.id
    }
    
    const existingSeeker = await prisma.seeker.findFirst({ where })
    
    if (!existingSeeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    // Handle relationships
    const { preferredProgramIds, campaignId, ...updateData } = body
    
    // Build update data with nested operations for relations
    const dataToUpdate: any = updateData
    
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
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only allow deleting own inquiries
    if (!isAdminRole(_user.role)) {
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