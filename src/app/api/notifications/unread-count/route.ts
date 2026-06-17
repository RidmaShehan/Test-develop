import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import {
  cleanupUnreadCountCache,
  getUnreadCountCacheKey,
  UNREAD_COUNT_CACHE_TTL_MS,
  unreadCountCache,
} from '@/lib/notifications/unread-count-cache'

// GET /api/notifications/unread-count - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const cacheKey = getUnreadCountCacheKey(user.id)
    
    // Check cache first
    const cached = unreadCountCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < UNREAD_COUNT_CACHE_TTL_MS) {
      return NextResponse.json({ count: cached.count, cached: true })
    }

    // Fetch from database
    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    })

    // Update cache
    unreadCountCache.set(cacheKey, { count, timestamp: Date.now() })
    
    // Clean up old cache entries (keep cache size reasonable)
    cleanupUnreadCountCache(100)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    return handleApiError(error)
  }
}
