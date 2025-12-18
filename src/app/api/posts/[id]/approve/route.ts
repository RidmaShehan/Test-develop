import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyNextApprover, notifyPostApproved, notifyPostFullyApproved } from '@/lib/notification-service'

// POST /api/posts/[id]/approve - Approve a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const { comment } = body

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

    // Check if it's user's turn (all previous approvers must have approved)
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
        status: 'APPROVED',
        comment: comment || null,
        approvedAt: new Date(),
      },
    })

    // Get post creator info for notifications
    const postWithCreator = await prisma.socialMediaPost.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Check if this was the last approver
    const nextApproval = post.approvals.find((a) => a.order > userApproval.order)

    if (!nextApproval) {
      // All approvals complete - update post status
      await prisma.socialMediaPost.update({
        where: { id },
        data: {
          status: 'APPROVED',
        },
      })

      // Notify creator that post is fully approved
      if (postWithCreator) {
        try {
          await notifyPostFullyApproved(
            postWithCreator.createdById,
            id,
            post.caption
          )
        } catch (error) {
          console.error('Error sending notification:', error)
        }
      }
    } else {
      // Notify next approver
      try {
        await notifyNextApprover(
          nextApproval.approverId,
          id,
          post.caption,
          user.name || user.email
        )
      } catch (error) {
        console.error('Error sending notification:', error)
      }

      // Also notify creator of progress
      if (postWithCreator) {
        try {
          await notifyPostApproved(
            postWithCreator.createdById,
            id,
            post.caption,
            user.name || user.email
          )
        } catch (error) {
          console.error('Error sending notification:', error)
        }
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
    console.error('Error approving post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve post' },
      { status: 500 }
    )
  }
}

