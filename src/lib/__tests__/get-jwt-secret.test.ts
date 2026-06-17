import { describe, it, expect, afterEach } from 'vitest'
import { getJwtSecret } from '../get-jwt-secret'

describe('getJwtSecret', () => {
  const originalEnv = process.env.JWT_SECRET

  afterEach(() => {
    process.env.JWT_SECRET = originalEnv
  })

  it('should throw on missing JWT_SECRET', () => {
    delete process.env.JWT_SECRET
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required/)
  })

  it('should throw on weak JWT_SECRET (less than 32 chars)', () => {
    process.env.JWT_SECRET = 'weak-secret'
    expect(() => getJwtSecret()).toThrow(/must be at least 32 characters/)
  })

  it('should throw on default placeholder JWT_SECRET', () => {
    process.env.JWT_SECRET = 'your-secret-key-change-in-production'
    expect(() => getJwtSecret()).toThrow(/must not be the default placeholder/)
  })

  it('should return secret if valid', () => {
    process.env.JWT_SECRET = 'valid-secret-key-with-at-least-32-chars'
    expect(getJwtSecret()).toBe('valid-secret-key-with-at-least-32-chars')
  })
})
