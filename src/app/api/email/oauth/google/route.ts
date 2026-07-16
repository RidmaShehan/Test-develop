import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getGoogleAuthUrl } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const url = getGoogleAuthUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
