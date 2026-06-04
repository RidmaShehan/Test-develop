import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_SETTINGS', req)

    const group = req.nextUrl.searchParams.get('group') || ''
    const settings = await prisma.systemSettings.findMany({
      where: group ? { key: { startsWith: group + '.' } } : {},
      orderBy: { key: 'asc' },
    })

    // Convert to object map
    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    return NextResponse.json({ success: true, data: map })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('UPDATE_SETTINGS', req)
    const body = await req.json()

    // body is a flat key-value map
    const entries = Object.entries(body as Record<string, string>)

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.systemSettings.upsert({
          where: { key },
          update: { value, updatedBy: user.id },
          create: { key, value, updatedBy: user.id },
        })
      )
    )

    return NextResponse.json({ success: true, message: 'Settings saved' })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
