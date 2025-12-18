import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyPostRejected } from '@/lib/notification-service'

// POST /api/posts/[id]/reject - Reject a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { comment } = body

    if (!comment || comment.trim() === '') {
      return NextResponse.json(
        { error: 'A comment explaining the rejection is required' },
        { status: 400 }
      )
    }

    // Get the post with approvals
    const post = await prisma.socialMediaPost.findUnique({
      where: { id },
      include: {
        approvals: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Find current user's approval
    const userApproval = post.approvals.find((a) => a.approverId === user.id)

    if (!userApproval) {
      return NextResponse.json(
        { error: 'You are not an approver for this post' },
        { status: 403 }
      )
    }

    if (userApproval.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'You have already processed this approval' },
        { status: 400 }
      )
    }

    // Check if it's user's turn
    const previousApprovals = post.approvals.filter((a) => a.order < userApproval.order)
    const allPreviousApproved = previousApprovals.every((a) => a.status === 'APPROVED')

    if (!allPreviousApproved) {
      return NextResponse.json(
        { error: 'Previous approvers must approve first' },
        { status: 400 }
      )
    }

    // Update approval status
    await prisma.postApproval.update({
      where: { id: userApproval.id },
      data: {
        status: 'REJECTED',
        comment,
        approvedAt: new Date(),
      },
    })

    // Update post status to REJECTED
    const updatedPostStatus = await prisma.socialMediaPost.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Notify post creator of rejection
    try {
      await notifyPostRejected(
        updatedPostStatus.createdById,
        id,
        post.caption,
        user.name || user.email,
        comment
      )
    } catch (error) {
      console.error('Error sending notification:', error)
    }

    // Get updated post
    const updatedPost = await prisma.socialMediaPost.findUnique({
      where: { id },
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

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error rejecting post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject post' },
      { status: 500 }
    )
  }
}

