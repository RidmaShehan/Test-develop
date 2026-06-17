import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'

const STAGE_ORDER = [
  'NEW',
  'ATTEMPTING_CONTACT',
  'CONNECTED',
  'QUALIFIED',
  'COUNSELING_SCHEDULED',
  'CONSIDERING',
  'READY_TO_REGISTER',
  'LOST',
]

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_SEEKER', req)

    const seekers = await prisma.seeker.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        stage: true,
        preferredStatus: true,
        marketingSource: true,
        createdAt: true,
        updatedAt: true,
        programInterest: { select: { id: true, name: true, campus: true } },
        assignments: {
          include: { coordinator: { select: { id: true, name: true } } },
          take: 1,
        },
        leadScore: { select: { score: true, tier: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const grouped: Record<string, typeof seekers> = {}
    for (const stage of STAGE_ORDER) {
      grouped[stage] = []
    }

    for (const seeker of seekers) {
      const stage = seeker.stage || 'NEW'
      if (!grouped[stage]) grouped[stage] = []
      grouped[stage].push(seeker)
    }

    const counts: Record<string, number> = {}
    for (const stage of STAGE_ORDER) {
      counts[stage] = grouped[stage].length
    }

    return NextResponse.json({ success: true, data: { columns: grouped, counts, stageOrder: STAGE_ORDER } })
  } catch (err: any) {
    if (err.name === 'AuthenticationError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.name === 'ForbiddenError') return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('UPDATE_SEEKER', req)

    const { seekerId, stage } = await req.json()
    if (!seekerId || !stage) {
      return NextResponse.json({ error: 'seekerId and stage are required' }, { status: 400 })
    }

    if (!STAGE_ORDER.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }

    const updated = await prisma.seeker.update({
      where: { id: seekerId },
      data: { stage: stage as any },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err.name === 'AuthenticationError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.name === 'ForbiddenError') return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
