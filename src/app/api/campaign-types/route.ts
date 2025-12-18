import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/campaign-types - Get all campaign types
// Accessible to all authenticated users regardless of role
export async function GET(request: NextRequest) {
  try {
    // Require authentication but allow any role
    const user = await requireAuth(request)
    
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    
    if (activeOnly) {
      where.isActive = true
    }

    const campaignTypes = await prisma.campaignType.findMany({
      where,
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
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(campaignTypes)
  } catch (error) {
    console.error('Error fetching campaign types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign types' },
      { status: 500 }
    )
  }
}

// POST /api/campaign-types - Create a new campaign type
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const {
      name,
      description,
      color,
      icon,
      isActive = true
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Campaign type name is required' },
        { status: 400 }
      )
    }

    // Check if campaign type with this name already exists
    const existingType = await prisma.campaignType.findUnique({
      where: { name }
    })

    if (existingType) {
      return NextResponse.json(
        { error: 'Campaign type with this name already exists' },
        { status: 400 }
      )
    }

    // Create campaign type
    const campaignType = await prisma.campaignType.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        icon: icon || null,
        isActive,
        isDefault: false, // User-created types are not default
        createdById: user.id
      },
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

    return NextResponse.json(campaignType, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign type:', error)
    
    if (error instanceof Error) {
      // Check for unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A campaign type with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create campaign type' },
      { status: 500 }
    )
  }
}

