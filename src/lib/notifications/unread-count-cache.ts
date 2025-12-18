// Shared in-memory cache for unread notification counts (server only).
// Kept in a separate module so route files don't export non-route symbols (Next.js restriction).

export const unreadCountCache = new Map<string, { count: number; timestamp: number }>()

export const UNREAD_COUNT_CACHE_TTL_MS = 5000 // 5 seconds

export function getUnreadCountCacheKey(userId: string) {
  return `unread-count-${userId}`
}

export function invalidateUnreadCountCache(userId: string) {
  unreadCountCache.delete(getUnreadCountCacheKey(userId))
}

export function cleanupUnreadCountCache(maxSize = 100) {
  if (unreadCountCache.size <= maxSize) return

  const now = Date.now()
  for (const [key, value] of unreadCountCache.entries()) {
    if (now - value.timestamp > UNREAD_COUNT_CACHE_TTL_MS * 2) {
      unreadCountCache.delete(key)
    }
  }
}


