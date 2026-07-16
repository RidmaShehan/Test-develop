import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const msgId = searchParams.get('msgId')

  if (msgId) {
    try {
      await prisma.emailInboxMessage.update({
        where: { id: msgId },
        data: {
          openCount: { increment: 1 },
          lastOpenedAt: new Date()
        }
      })
    } catch (err) {
      console.error('Failed to log tracking pixel open:', err)
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
