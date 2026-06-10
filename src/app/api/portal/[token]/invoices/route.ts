import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken } from '@/lib/portal-token'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = verifyPortalToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where: { seekerId: payload.seekerId },
    include: {
      items: true,
      payments: { select: { id: true, amount: true, paidAt: true, method: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: invoices })
}
