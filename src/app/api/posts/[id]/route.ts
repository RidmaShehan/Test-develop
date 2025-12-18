import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const post = await prisma.socialMediaPost.findUnique({
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
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check permissions: admin or creator or approver
    const isAdminUser = isAdminRole(user.role)
    const isCreator = post.createdById === user.id
    const isApprover = post.approvals.some((a) => a.approverId === user.id)

    if (!isAdminUser && !isCreator && !isApprover) {
      return NextResponse.json(
        { error: 'You do not have permission to view this post' },
        { status: 403 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Check if post exists and user has permission
    const existingPost = await prisma.socialMediaPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only creator can update (and only if not yet approved)
    if (existingPost.createdById !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this post' },
        { status: 403 }
      )
    }

    if (existingPost.status === 'APPROVED' || existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot update an approved or published post' },
        { status: 400 }
      )
    }

    const { caption, imageUrl, budget, startDate, endDate, programId, campaignId } = body

    // Update post
    const updatedPost = await prisma.socialMediaPost.update({
      where: { id },
      data: {
        ...(caption && { caption }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(campaignId !== undefined && { campaignId: campaignId || null }),
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

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const isAdminUser = isAdminRole(user.role)

    // Check if post exists
    const existingPost = await prisma.socialMediaPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only creator or admin can delete
    if (existingPost.createdById !== user.id && !isAdminUser) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this post' },
        { status: 403 }
      )
    }

    // Cannot delete published posts
    if (existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot delete a published post' },
        { status: 400 }
      )
    }

    await prisma.socialMediaPost.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    )
  }
}

