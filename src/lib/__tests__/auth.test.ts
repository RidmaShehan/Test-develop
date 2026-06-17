import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifyToken, hashPassword, comparePassword, isAdminRole, generateToken } from '../auth'

describe('auth utilities', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret-key-at-least-32-chars-long')
  })

  it('should hash and compare passwords correctly', async () => {
    const pwd = 'password123'
    const hash = await hashPassword(pwd)
    expect(hash).not.toBe(pwd)
    expect(await comparePassword(pwd, hash)).toBe(true)
    expect(await comparePassword('wrongpwd', hash)).toBe(false)
  })

  it('should verify token and return payload', () => {
    const user = { id: '123', name: 'John Doe', email: 'john@example.com', role: 'USER', isActive: true }
    const token = generateToken(user)
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.id).toBe('123')
    expect(payload?.email).toBe('john@example.com')
  })

  it('should verify admin roles correctly', () => {
    expect(isAdminRole('ADMIN')).toBe(true)
    expect(isAdminRole('ADMINISTRATOR')).toBe(true)
    expect(isAdminRole('DEVELOPER')).toBe(true)
    expect(isAdminRole('USER')).toBe(false)
  })
})
