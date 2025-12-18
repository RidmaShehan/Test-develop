import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/campaign-types/[id] - Get a specific campaign type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    const campaignType = await prisma.campaignType.findUnique({
      where: {
        id: id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    if (!campaignType) {
      return NextResponse.json(
        { error: 'Campaign type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaignType)
  } catch (error) {
    console.error('Error fetching campaign type:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign type' },
      { status: 500 }
    )
  }
}

// PUT /api/campaign-types/[id] - Update a campaign type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    const body = await request.json()
    const { name, description, color, icon, isActive } = body

    // Check if campaign type exists
    const existingType = await prisma.campaignType.findUnique({
      where: { id: id }
    })

    if (!existingType) {
      return NextResponse.json(
        { error: 'Campaign type not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it conflicts with existing
    if (name && name !== existingType.name) {
      const nameConflict = await prisma.campaignType.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Campaign type with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (isActive !== undefined) updateData.isActive = isActive

    const campaignType = await prisma.campaignType.update({
      where: { id: id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    return NextResponse.json(campaignType)
  } catch (error) {
    console.error('Error updating campaign type:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign type' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaign-types/[id] - Delete a campaign type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if campaign type exists
    const existingType = await prisma.campaignType.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    if (!existingType) {
      return NextResponse.json(
        { error: 'Campaign type not found' },
        { status: 404 }
      )
    }

    // Check if it's a default type
    if (existingType.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default campaign types' },
        { status: 400 }
      )
    }

    // Check if it has associated campaigns
    if (existingType._count.campaigns > 0) {
      return NextResponse.json(
        { error: 'Cannot delete campaign type that has associated campaigns' },
        { status: 400 }
      )
    }

    // Delete the campaign type
    await prisma.campaignType.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Campaign type deleted successfully' })
  } catch (error) {
    console.error('Error deleting campaign type:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign type' },
      { status: 500 }
    )
  }
}
