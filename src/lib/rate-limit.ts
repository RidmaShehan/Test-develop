import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export interface RateLimitOptions {
  /** Max number of requests in the window */
  limit: number
  /** Window in seconds */
  windowSeconds: number
}

/**
 * Returns true if the request is allowed, false if rate limited.
 * Uses a Redis-based sliding window algorithm with pipelines.
 */
export async function rateLimit(key: string, options: RateLimitOptions): Promise<boolean> {
  const redisKey = `ratelimit:${key}`
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const clearBefore = now - windowMs

  try {
    const p = redis.pipeline()
    // Remove expired entries from the sliding window
    p.zremrangebyscore(redisKey, 0, clearBefore)
    // Add the current request timestamp with a unique identifier to avoid collisions
    const member = `${now}-${Math.random()}`
    p.zadd(redisKey, { score: now, member })
    // Get the total number of hits within the window
    p.zcard(redisKey)
    // Set a TTL on the key to ensure automatic cleanup of inactive keys
    p.expire(redisKey, options.windowSeconds)

    const results = await p.exec()
    const count = results[2] as number

    if (count > options.limit) {
      return false
    }
    return true
  } catch (error) {
    console.error('Rate limiting error, allowing request by default:', error)
    return true
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
