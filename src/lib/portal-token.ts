import jwt from 'jsonwebtoken'

const PORTAL_SECRET = process.env.JWT_SECRET || 'portal-secret-change-me'
const PORTAL_TOKEN_TTL = 72 * 60 * 60 // 72 hours in seconds

interface PortalTokenPayload {
  seekerId: string
  type: 'portal'
  iat?: number
  exp?: number
}

export function generatePortalToken(seekerId: string): string {
  return jwt.sign({ seekerId, type: 'portal' }, PORTAL_SECRET, { expiresIn: PORTAL_TOKEN_TTL })
}

export function verifyPortalToken(token: string): PortalTokenPayload | null {
  try {
    const payload = jwt.verify(token, PORTAL_SECRET) as PortalTokenPayload
    if (payload.type !== 'portal') return null
    return payload
  } catch {
    return null
  }
}
