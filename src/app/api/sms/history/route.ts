import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('SEND_SMS', req)

    const messages = await prisma.sMSMessage.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
        recipients: { where: { status: 'SENT' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
