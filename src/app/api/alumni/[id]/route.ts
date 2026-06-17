import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_ALUMNI', req)
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.alumni.update({
      where: { id },
      data: { ...body, ...(body.graduatedAt && { graduatedAt: new Date(body.graduatedAt) }) },
      include: {
        seeker: { select: { id: true, fullName: true, email: true } },
        program: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_ALUMNI', req)
    const { id } = await params
    await prisma.alumni.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
