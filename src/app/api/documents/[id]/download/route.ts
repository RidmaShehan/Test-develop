import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { getSignedUrl } from '@/lib/cloudinary'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('READ_DOCUMENTS', req)
    const { id } = await params

    const document = await prisma.document.findUnique({ where: { id, deletedAt: null } })
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const url = getSignedUrl(document.cloudinaryId)
    return NextResponse.json({ success: true, data: { url, fileName: document.fileName } })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
