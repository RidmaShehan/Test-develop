import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'

// DELETE /api/push/unsubscribe - Unsubscribe user from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing required field: endpoint' },
        { status: 400 }
      )
    }

    // Find and deactivate the subscription
    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Verify the subscription belongs to the user
    if (subscription.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Deactivate instead of deleting to keep history
    await prisma.pushSubscription.update({
      where: { endpoint },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    return handleApiError(error)
  }
}

