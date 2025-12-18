import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'
import { cookies as nextCookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface AuthUser extends User {
  token: string
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Verify JWT token
export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Helper function to check if user has admin privileges
export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'DEVELOPER'
}

// Get current user from token
export async function getCurrentUser(token?: string): Promise<User | null> {
  if (!token) {
    // No token means no authenticated user - return null
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id
    },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  })

  if (!user || !user.isActive) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  }
}

// Require authentication
export async function requireAuth(request?: Request | any): Promise<User> {
  let token: string | undefined
  
  if (request) {
    // Handle NextRequest cookies (NextRequest has cookies property)
    if (request.cookies && typeof request.cookies.get === 'function') {
      token = request.cookies.get('auth-token')?.value
    } else {
      // Fallback: try to parse cookie header manually
      const cookieHeader = request.headers?.get('cookie')
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => {
            const [key, ...rest] = c.split('=')
            return [key, rest.join('=')]
          })
        )
        token = cookies['auth-token']
      }
    }
    
    // Also check Authorization header
    const authHeader = request.headers?.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '')
    }
  }
  
  // If request isn't available (e.g., server component / server action),
  // attempt to read the cookie via Next.js server headers.
  if (!token) {
    try {
      token = nextCookies().get('auth-token')?.value
    } catch {
      // Not in a Next.js server context; ignore.
    }
  }

  // If we have a token, try to verify it
  if (token) {
    const user = await getCurrentUser(token)
    if (user) {
      return user
    }
  }
  
  // No valid authentication found - throw error
  throw new Error('Authentication required')
}

// Require specific role
export async function requireRole(role: string, request?: Request): Promise<User> {
  const user = await requireAuth(request)
  
  if (user.role !== role && !isAdminRole(user.role)) {
    throw new Error(`Access denied. Required role: ${role}`)
  }
  
  return user
}

// Login function
export async function login(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      email: email
    }
  })

  if (!user || !user.isActive) {
    return null
  }

  // For development, we'll skip password check if no password is set
  if (user.password) {
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return null
    }
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    token
  }
}

// Register function
export async function register(userData: {
  name: string
  email: string
  password: string
  role?: string
}): Promise<AuthUser | null> {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: userData.email
    }
  })

  if (existingUser) {
    return null
  }

  const hashedPassword = await hashPassword(userData.password)

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: (userData.role as UserRole) || UserRole.ADMIN,
      isActive: true
    }
  })

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    token
  }
}