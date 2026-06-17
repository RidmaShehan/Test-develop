import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_EVENT', req)
    const { id: eventId } = await params
    const { registrationId, attended } = await req.json()

    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId, eventId },
      data: { attended: attended ?? true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
