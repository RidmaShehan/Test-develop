import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('READ_EVENT', req)
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        registrations: {
          include: { seeker: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: event })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_EVENT', req)
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...body,
        ...(body.startAt && { startAt: new Date(body.startAt) }),
        ...(body.endAt && { endAt: new Date(body.endAt) }),
      },
      include: { createdBy: { select: { id: true, name: true } }, _count: { select: { registrations: true } } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_EVENT', req)
    const { id } = await params
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
