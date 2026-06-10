import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken } from '@/lib/portal-token'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = verifyPortalToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 })

  const seeker = await prisma.seeker.findUnique({
    where: { id: payload.seekerId },
    include: {
      programInterest: { select: { id: true, name: true, campus: true } },
    },
  })

  if (!seeker) return NextResponse.json({ error: 'Seeker not found' }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      id: seeker.id,
      fullName: seeker.fullName,
      email: seeker.email,
      phone: seeker.phone,
      stage: seeker.stage,
      program: seeker.programInterest ?? null,
    },
  })
}
