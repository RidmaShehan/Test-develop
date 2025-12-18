import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

// GET /api/campaigns - Get all campaigns
// Accessible to all authenticated users
// For inquiry form: all users can see all ACTIVE campaigns
// For other contexts: normal users see only their own campaigns
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Build where clause for user filtering
    const where: any = {
      isDeleted: false
    }
    
    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const forInquiry = searchParams.get('forInquiry') === 'true' // Special flag for inquiry form
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // If fetching for inquiry form, allow all users to see all ACTIVE campaigns
    // Otherwise, apply role-based filtering
    if (forInquiry) {
      // For inquiry form: show all ACTIVE campaigns to all authenticated users
      where.status = 'ACTIVE'
    } else {
      // For other contexts: apply role-based filtering
      if (!isAdminRole(user.role)) {
        where.createdById = user.id
      }
    }

    if (status && status !== 'all' && !forInquiry) {
      // Don't override status if forInquiry is set (it's already set to ACTIVE)
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { targetAudience: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const total = await prisma.campaign.count({ where })

    // Get campaigns with pagination
    const campaigns = await prisma.campaign.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    console.error('❌ ERROR in /api/campaigns:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
        details: error instanceof Error ? error.stack : undefined,
        route: '/api/campaigns'
      },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const {
      name,
      description,
      type,
      targetAudience,
      startDate,
      endDate,
      budget,
      imageUrl,
      status = 'DRAFT'
    } = body

    // Validate required fields
    if (!name || !type || !targetAudience || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, targetAudience, and startDate are required' },
        { status: 400 }
      )
    }

    // Validate date range
    if (endDate && new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after or equal to start date' },
        { status: 400 }
      )
    }

    // Check if campaign type exists
    const campaignType = await prisma.campaignType.findUnique({
      where: { name: type }
    })

    if (!campaignType) {
      return NextResponse.json(
        { error: `Campaign type "${type}" not found` },
        { status: 400 }
      )
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description: description || null,
        type,
        targetAudience,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        imageUrl: imageUrl || null,
        status,
        createdById: user.id,
        // Initialize analytics fields
        views: 0,
        netFollows: 0,
        totalWatchTime: 0,
        averageWatchTime: 0,
        totalInteractions: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        linkClicks: 0,
      },
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

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    
    if (error instanceof Error) {
      // Check for unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A campaign with this name already exists' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

