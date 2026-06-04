import { NextRequest, NextResponse } from 'next/server'
import { AuthenticationError, isAdminRole, requireAuth } from '@/lib/auth'
import {
  computeFollowUpCompliance,
  DEFAULT_BREACH_THRESHOLD_HOURS,
} from '@/lib/follow-up-compliance'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const thresholdInput = Number(searchParams.get('hours') || DEFAULT_BREACH_THRESHOLD_HOURS)
    const breachThresholdHours =
      Number.isFinite(thresholdInput) && thresholdInput > 0
        ? thresholdInput
        : DEFAULT_BREACH_THRESHOLD_HOURS

    const result = await computeFollowUpCompliance(breachThresholdHours)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error computing follow-up compliance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compute follow-up compliance' },
      { status: 500 }
    )
  }
}
