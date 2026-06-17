import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_DOCUMENTS', req)

    const search = req.nextUrl.searchParams.get('search') ?? ''
    const status = req.nextUrl.searchParams.get('status') ?? ''
    const category = req.nextUrl.searchParams.get('category') ?? ''

    const documents = await prisma.document.findMany({
      where: {
        deletedAt: null,
        ...(status && { status: status as any }),
        ...(category && { documentType: { category: category as any } }),
        ...(search && {
          OR: [
            { seeker: { fullName: { contains: search, mode: 'insensitive' } } },
            { documentType: { name: { contains: search, mode: 'insensitive' } } },
            { fileName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        seeker: { select: { id: true, fullName: true, email: true } },
        documentType: true,
        uploadedBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ success: true, data: documents })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
