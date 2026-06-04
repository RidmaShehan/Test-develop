import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { notifyPostRejected, notifyPostRejectedAssignedToYou } from '@/lib/notification-service'

// POST /api/posts/[id]/reject - Reject a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { comment, assignedToId } = body

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

    if (post.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: 'Post is not pending approval' },
        { status: 400 }
      )
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

    // Update approval status and post status in a single transaction
    await prisma.$transaction(async (tx) => {
      // Mark current approver as rejected
      await tx.postApproval.update({
        where: { id: userApproval.id },
        data: {
          status: 'REJECTED',
          comment: comment.trim(),
          approvedAt: new Date(),
        },
      })

      // Optionally mark any later pending approvals as rejected to reflect that the chain has stopped
      await tx.postApproval.updateMany({
        where: {
          postId: id,
          order: { gt: userApproval.order },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          comment: 'Automatically cancelled after earlier rejection',
          approvedAt: new Date(),
        },
      })

      // Update post status to REJECTED and optional assignee (for reverse process / resubmit)
      await tx.socialMediaPost.update({
        where: { id },
        data: {
          status: 'REJECTED',
          assignedToId: assignedToId && typeof assignedToId === 'string' ? assignedToId : null,
        },
      })
    })

    const approverName = user.name || user.email
    const reason = comment.trim()

    // Notify post creator of rejection
    try {
      await notifyPostRejected(
        post.createdById,
        id,
        post.caption,
        approverName,
        reason
      )
    } catch (error) {
      console.error('Error sending notification:', error)
    }

    // If assigned to someone (e.g. to revise), notify that user too
    if (assignedToId && typeof assignedToId === 'string') {
      try {
        await notifyPostRejectedAssignedToYou(
          assignedToId,
          id,
          post.caption,
          approverName,
          reason
        )
      } catch (error) {
        console.error('Error sending assignment notification:', error)
      }
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
        assignedTo: {
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
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject post' },
      { status: 500 }
    )
  }
}

