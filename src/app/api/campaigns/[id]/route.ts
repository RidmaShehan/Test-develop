import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'

// GET /api/campaigns/[id] - Get a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaignType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        seekers: {
          include: {
            seeker: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                city: true,
                marketingSource: true,
                stage: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        },
        _count: {
          select: {
            seekers: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this campaign
    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && campaign.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this campaign' },
        { status: 403 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id] - Update a campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    const body = await request.json()
    
    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to update this campaign
    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && existingCampaign.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this campaign' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) {
      // Verify campaign type exists
      const campaignType = await prisma.campaignType.findUnique({
        where: { name: body.type }
      })
      if (!campaignType) {
        return NextResponse.json(
          { error: `Campaign type "${body.type}" not found` },
          { status: 400 }
        )
      }
      updateData.type = body.type
    }
    if (body.targetAudience !== undefined) updateData.targetAudience = body.targetAudience
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
    
    // Validate date range
    const finalStartDate = updateData.startDate || existingCampaign.startDate
    const finalEndDate = updateData.endDate !== undefined ? updateData.endDate : existingCampaign.endDate
    if (finalEndDate && new Date(finalEndDate) < new Date(finalStartDate)) {
      return NextResponse.json(
        { error: 'End date must be after or equal to start date' },
        { status: 400 }
      )
    }
    if (body.budget !== undefined) updateData.budget = body.budget ? parseFloat(body.budget) : null
    if (body.reach !== undefined) updateData.reach = body.reach ? parseInt(body.reach) : null
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.status !== undefined) updateData.status = body.status
    
    // Analytics fields
    if (body.views !== undefined) updateData.views = body.views
    if (body.netFollows !== undefined) updateData.netFollows = body.netFollows
    if (body.totalWatchTime !== undefined) updateData.totalWatchTime = body.totalWatchTime
    if (body.averageWatchTime !== undefined) updateData.averageWatchTime = body.averageWatchTime
    if (body.audienceRetention !== undefined) updateData.audienceRetention = body.audienceRetention
    if (body.totalInteractions !== undefined) updateData.totalInteractions = body.totalInteractions
    if (body.reactions !== undefined) updateData.reactions = body.reactions
    if (body.comments !== undefined) updateData.comments = body.comments
    if (body.shares !== undefined) updateData.shares = body.shares
    if (body.saves !== undefined) updateData.saves = body.saves
    if (body.linkClicks !== undefined) updateData.linkClicks = body.linkClicks
    if (body.trafficSources !== undefined) updateData.trafficSources = body.trafficSources
    if (body.audienceDemographics !== undefined) updateData.audienceDemographics = body.audienceDemographics

    const campaign = await prisma.campaign.update({
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
        campaignType: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            seekers: true
          }
        }
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id] - Soft delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to delete this campaign
    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && existingCampaign.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this campaign' },
        { status: 403 }
      )
    }

    // Soft delete the campaign
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Campaign moved to trash successfully',
      campaign 
    })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

