import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>>
  try {
    user = await requireAuth(req)
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  let lastCheckAt = new Date()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      // Initial ping to confirm connection
      send({ type: 'connected', userId: user.id })

      const poll = async () => {
        try {
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId: user.id,
              createdAt: { gt: lastCheckAt },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          })

          if (newNotifications.length > 0) {
            lastCheckAt = new Date()
            send({ type: 'notifications', payload: newNotifications })
          }
        } catch {}
      }

      // Poll every 5 seconds for new notifications
      const pollInterval = setInterval(poll, 5000)

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        send({ type: 'heartbeat', ts: Date.now() })
      }, 30000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        clearInterval(heartbeatInterval)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
