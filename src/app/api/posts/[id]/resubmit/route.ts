import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { notifyApprovalRequest } from '@/lib/notification-service'

// POST /api/posts/[id]/resubmit - Resubmit a rejected post (reverse process: back to approval chain)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const post = await prisma.socialMediaPost.findUnique({
      where: { id },
      include: {
        approvals: { orderBy: { order: 'asc' } },
        assignedTo: { select: { id: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Only rejected posts can be resubmitted' },
        { status: 400 }
      )
    }

    const isAssignedTo = post.assignedToId === user.id
    const isCreator = post.createdById === user.id
    if (!isAssignedTo && !isCreator) {
      return NextResponse.json(
        { error: 'Only the assigned user or post creator can resubmit this post' },
        { status: 403 }
      )
    }

    const firstApprover = post.approvals[0]
    if (!firstApprover) {
      return NextResponse.json(
        { error: 'Post has no approval chain' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Reset all approvals to PENDING so the chain runs again
      await tx.postApproval.updateMany({
        where: { postId: id },
        data: {
          status: 'PENDING',
          comment: null,
          approvedAt: null,
        },
      })
      // Set post back to PENDING_APPROVAL and clear assignee
      await tx.socialMediaPost.update({
        where: { id },
        data: {
          status: 'PENDING_APPROVAL',
          assignedToId: null,
        },
      })
    })

    try {
      await notifyApprovalRequest(
        firstApprover.approverId,
        id,
        post.caption,
        user.name || user.email
      )
    } catch (error) {
      console.error('Error sending resubmit notification:', error)
    }

    const updatedPost = await prisma.socialMediaPost.findUnique({
      where: { id },
      include: {
        program: true,
        campaign: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        approvals: {
          include: { approver: { select: { id: true, name: true, email: true } } },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error resubmitting post:', error)
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resubmit post' },
      { status: 500 }
    )
  }
}
