import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/authorization'
import { calculateLeadScore, recalculateAllScores } from '@/lib/lead-score'

export async function POST(req: NextRequest) {
  try {
    await requirePermission('UPDATE_SEEKER', req)

    const body = await req.json().catch(() => ({}))
    const { seekerId, all } = body

    if (all) {
      const result = await recalculateAllScores()
      return NextResponse.json({ success: true, data: result })
    }

    if (!seekerId) {
      return NextResponse.json({ error: 'seekerId or all:true required' }, { status: 400 })
    }

    const score = await calculateLeadScore(seekerId)
    return NextResponse.json({ success: true, data: score })
  } catch (err: any) {
    if (err.name === 'AuthenticationError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.name === 'ForbiddenError') return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to calculate score' }, { status: 500 })
  }
}
