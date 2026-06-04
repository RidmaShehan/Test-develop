import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_DOCUMENTS', req)

    const category = req.nextUrl.searchParams.get('category')
    const types = await prisma.documentType.findMany({
      where: category ? { category: category as any } : {},
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ success: true, data: types })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch document types' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('MANAGE_DOCUMENTS', req)
    const body = await req.json()

    const { name, code, category, description, isRequired, acceptedFormats, maxSizeMb, hasExpiry } = body

    if (!name || !code || !category) {
      return NextResponse.json({ error: 'name, code, and category are required' }, { status: 400 })
    }

    const type = await prisma.documentType.create({
      data: {
        name,
        code: code.toUpperCase(),
        category,
        description,
        isRequired: isRequired ?? true,
        acceptedFormats: acceptedFormats ?? 'pdf,jpg,png',
        maxSizeMb: maxSizeMb ?? 5,
        hasExpiry: hasExpiry ?? false,
      },
    })

    return NextResponse.json({ success: true, data: type }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    if (err.code === 'P2002') return NextResponse.json({ error: 'Document type code already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create document type' }, { status: 500 })
  }
}
