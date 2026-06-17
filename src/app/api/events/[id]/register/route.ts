import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const body = await req.json()
    const { name, email, phone, seekerId } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    if (event.maxAttendees) {
      const count = await prisma.eventRegistration.count({ where: { eventId } })
      if (count >= event.maxAttendees) {
        return NextResponse.json({ error: 'Event is full' }, { status: 400 })
      }
    }

    const registration = await prisma.eventRegistration.create({
      data: { eventId, name, email, phone, seekerId },
    })

    return NextResponse.json({ success: true, data: registration }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
