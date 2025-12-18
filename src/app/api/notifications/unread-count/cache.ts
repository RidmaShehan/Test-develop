// Simple in-memory cache for unread counts (5 second TTL)
const cache = new Map<string, { count: number; timestamp: number }>()
const CACHE_TTL = 5000 // 5 seconds

export function getUnreadCountCache(userId: string): number | null {
  const cacheKey = `unread-count-${userId}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.count
  }
  return null
}

export function setUnreadCountCache(userId: string, count: number) {
  const cacheKey = `unread-count-${userId}`
  cache.set(cacheKey, { count, timestamp: Date.now() })

  // Clean up old cache entries (keep cache size reasonable)
  if (cache.size > 100) {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key)
      }
    }
  }
}

// Call this when notifications are read/changed
export function invalidateUnreadCountCache(userId: string) {
  cache.delete(`unread-count-${userId}`)
}


