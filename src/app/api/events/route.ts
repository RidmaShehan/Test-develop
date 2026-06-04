import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_EVENT', req)

    const status = req.nextUrl.searchParams.get('status')
    const type = req.nextUrl.searchParams.get('type')

    const events = await prisma.event.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: events })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('MANAGE_EVENT', req)
    const body = await req.json()

    const { title, description, type, startAt, endAt, venue, onlineLink, maxAttendees, imageUrl } = body

    if (!title || !type || !startAt || !endAt) {
      return NextResponse.json({ error: 'title, type, startAt, endAt are required' }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        venue,
        onlineLink,
        maxAttendees,
        imageUrl,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
