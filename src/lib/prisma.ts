import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure Prisma client is properly initialized
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

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
