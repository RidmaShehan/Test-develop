import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getMicrosoftAuthUrl } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const url = getMicrosoftAuthUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
