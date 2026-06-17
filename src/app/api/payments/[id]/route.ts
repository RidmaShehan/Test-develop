import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('READ_PAYMENTS', req)
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        seeker: { select: { id: true, fullName: true, email: true, phone: true } },
        items: true,
        payments: { include: { recordedBy: { select: { id: true, name: true } } } },
      },
    })

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: invoice })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('MANAGE_PAYMENTS', req)
    const { id } = await params
    const body = await req.json()

    // Record a payment against an invoice
    if (body.action === 'record_payment') {
      const { amount, method, reference, notes, paidAt } = body

      if (!amount || !method) {
        return NextResponse.json({ error: 'amount and method are required' }, { status: 400 })
      }

      const invoice = await prisma.invoice.findUnique({ where: { id }, include: { payments: true } })
      if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

      const totalPaid = Number(invoice.payments.reduce((s, p) => s + Number(p.amount), 0)) + Number(amount)
      const newStatus = totalPaid >= Number(invoice.total) ? 'PAID' : 'PARTIAL'

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            invoiceId: id,
            amount,
            method,
            reference,
            notes,
            paidAt: paidAt ? new Date(paidAt) : new Date(),
            recordedById: user.id,
          },
        }),
        prisma.invoice.update({ where: { id }, data: { status: newStatus as any } }),
      ])

      const updated = await prisma.invoice.findUnique({
        where: { id },
        include: { items: true, payments: { include: { recordedBy: { select: { id: true, name: true } } } }, seeker: { select: { id: true, fullName: true } } },
      })

      return NextResponse.json({ success: true, data: updated })
    }

    // Update invoice fields
    const updated = await prisma.invoice.update({
      where: { id },
      data: { ...body },
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
    await requirePermission('MANAGE_PAYMENTS', req)
    const { id } = await params

    await prisma.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
