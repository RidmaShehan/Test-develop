import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { AuthenticationError } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('MANAGE_DOCUMENTS', req)
    const { id } = await params

    const document = await prisma.document.findUnique({ where: { id, deletedAt: null } })
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } })

    try {
      await deleteFromCloudinary(
        document.cloudinaryId,
        document.fileFormat === 'pdf' ? 'raw' : 'image'
      )
    } catch (cloudErr) {
      console.warn('Cloudinary delete failed (non-critical):', cloudErr)
    }

    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
