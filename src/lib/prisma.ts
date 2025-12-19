import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure Prisma client is properly initialized with connection pooling for serverless
// Note: Connection pooling is configured via DATABASE_URL parameters:
// - Use transaction pooling (port 6543) instead of session pooling (port 5432)
// - Add ?pgbouncer=true&connection_limit=1 to DATABASE_URL
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
}

// Hot-reload safety:
// When Prisma Client is regenerated (e.g., after schema changes), Next dev server may keep
// an old PrismaClient instance on globalThis. That instance can be missing new model accessors.
// Recreate the client if critical model accessors are missing.
const cached = globalForPrisma.prisma
const isStale =
  !!cached && !('whatsAppTemplate' in (cached as unknown as Record<string, unknown>))

export const prisma = !cached || isStale ? createPrismaClient() : cached

// In production (Vercel), also cache on globalThis to prevent multiple instances
// This is critical for serverless environments where each function invocation
// might otherwise create a new Prisma client instance
if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = prisma
} else {
  globalForPrisma.prisma = prisma
}
