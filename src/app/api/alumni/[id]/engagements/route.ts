import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_ALUMNI', req)
    const { id: alumniId } = await params
    const { type, notes } = await req.json()

    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

    const engagement = await prisma.alumniEngagement.create({
      data: { alumniId, type, notes },
    })

    return NextResponse.json({ success: true, data: engagement }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to log engagement' }, { status: 500 })
  }
}
