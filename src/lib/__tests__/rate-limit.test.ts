import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '../rate-limit'

// Mock Upstash Redis pipeline
const mockPipeline = {
  zremrangebyscore: vi.fn().mockReturnThis(),
  zadd: vi.fn().mockReturnThis(),
  zcard: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: vi.fn(),
}

vi.mock('@upstash/redis', () => {
  return {
    Redis: class {
      pipeline() {
        return mockPipeline
      }
    }
  }
})

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow request when within limits', async () => {
    // Pipeline exec results:
    // results[0] -> zremrangebyscore output
    // results[1] -> zadd output
    // results[2] -> zcard output (current request count)
    // results[3] -> expire output
    mockPipeline.exec.mockResolvedValue([0, 1, 3, 1])
    const allowed = await rateLimit('test-key', { limit: 5, windowSeconds: 60 })
    expect(allowed).toBe(true)
  })

  it('should block request when limit is exceeded', async () => {
    mockPipeline.exec.mockResolvedValue([0, 1, 6, 1])
    const allowed = await rateLimit('test-key', { limit: 5, windowSeconds: 60 })
    expect(allowed).toBe(false)
  })
})
