import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { notifyApprovalRequest } from '@/lib/notification-service'

// GET /api/posts - Get all posts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const isAdminUser = isAdminRole(user.role)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Filter by status if provided
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Non-admin users only see their own posts
    if (!isAdminUser) {
      where.createdById = user.id
    }

    // Fetch posts with relations
    const [posts, total] = await prisma.$transaction([
      prisma.socialMediaPost.findMany({
        where,
        include: {
          program: {
            select: {
              id: true,
              name: true,
              campus: true,
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.socialMediaPost.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const {
      caption,
      imageUrl,
      budget,
      startDate,
      endDate,
      programId,
      campaignId,
      approvers, // Array of user IDs in approval order
    } = body

    // Validate required fields
    if (!caption || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Caption, start date, and end date are required' },
        { status: 400 }
      )
    }

    // Validate approvers
    if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
      return NextResponse.json(
        { error: 'At least one approver is required' },
        { status: 400 }
      )
    }

    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Create post with approvals
    const post = await prisma.socialMediaPost.create({
      data: {
        caption,
        imageUrl,
        budget: budget ? parseFloat(budget) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'PENDING_APPROVAL',
        programId: programId || null,
        campaignId: campaignId || null,
        createdById: user.id,
        approvals: {
          create: approvers.map((approverId: string, index: number) => ({
            approverId,
            order: index + 1,
            status: index === 0 ? 'PENDING' : 'PENDING', // First approver gets pending
          })),
        },
      },
      include: {
        program: true,
        campaign: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    // Send notification to first approver
    try {
      const firstApprover = post.approvals[0]
      if (firstApprover) {
        await notifyApprovalRequest(
          firstApprover.approverId,
          post.id,
          post.caption,
          user.name || user.email
        )
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      // Don't fail the post creation if notification fails
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}

