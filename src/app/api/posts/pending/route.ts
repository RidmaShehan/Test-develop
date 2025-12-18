import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/posts/pending - Get posts pending approval for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Find posts where user is the next approver
    const posts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'PENDING_APPROVAL',
        approvals: {
          some: {
            approverId: user.id,
            status: 'PENDING',
          },
        },
      },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter to only include posts where it's actually the user's turn
    const pendingForUser = posts.filter((post) => {
      const userApproval = post.approvals.find((a) => a.approverId === user.id)
      if (!userApproval || userApproval.status !== 'PENDING') return false

      // Check if all previous approvals are complete
      const previousApprovals = post.approvals.filter((a) => a.order < userApproval.order)
      return previousApprovals.every((a) => a.status === 'APPROVED')
    })

    return NextResponse.json({ posts: pendingForUser, count: pendingForUser.length })
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch pending approvals' },
      { status: 500 }
    )
  }
}

