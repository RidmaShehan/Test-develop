import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_PAYMENTS', req)

    const seekerId = req.nextUrl.searchParams.get('seekerId')
    const status = req.nextUrl.searchParams.get('status')

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(seekerId && { seekerId }),
        ...(status && { status: status as any }),
      },
      include: {
        seeker: { select: { id: true, fullName: true, email: true } },
        items: true,
        payments: { include: { recordedBy: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: invoices })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('MANAGE_PAYMENTS', req)
    const body = await req.json()
    const { seekerId, items, discount, notes, dueDate } = body

    if (!seekerId || !items?.length) {
      return NextResponse.json({ error: 'seekerId and items are required' }, { status: 400 })
    }

    const seeker = await prisma.seeker.findUnique({ where: { id: seekerId } })
    if (!seeker) return NextResponse.json({ error: 'Seeker not found' }, { status: 404 })

    // Generate invoice number
    const count = await prisma.invoice.count()
    const invoiceNo = `INV-${String(count + 1).padStart(5, '0')}`

    const subtotal = items.reduce((s: number, item: any) => s + item.qty * item.unitPrice, 0)
    const discountAmt = discount || 0
    const total = subtotal - discountAmt

    const invoice = await prisma.invoice.create({
      data: {
        seekerId,
        invoiceNo,
        subtotal,
        discount: discountAmt,
        total,
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
            total: item.qty * item.unitPrice,
          })),
        },
      },
      include: {
        seeker: { select: { id: true, fullName: true, email: true } },
        items: true,
        payments: true,
      },
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
