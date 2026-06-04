import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken } from '@/lib/portal-token'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, getStudentFolder, type DocumentCategory } from '@/lib/cloudinary'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const payload = verifyPortalToken(params.token)
  if (!payload) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const documentTypeId = formData.get('documentTypeId') as string | null

    if (!file || !documentTypeId) return NextResponse.json({ error: 'file and documentTypeId required' }, { status: 400 })

    const documentType = await prisma.documentType.findUnique({ where: { id: documentTypeId } })
    if (!documentType) return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const category = (documentType.category?.toLowerCase() || 'other') as DocumentCategory
    const folder = getStudentFolder(payload.seekerId, category)
    const uploadResult = await uploadToCloudinary(buffer, { folder, fileName: file.name, resourceType: 'auto' })

    // Determine system user for upload tracking (portal uploads have no admin user)
    // We use the first admin user or skip the uploadedById constraint if optional
    // The Document model requires uploadedById — use a system placeholder
    const systemUser = await prisma.user.findFirst({ where: { role: 'ADMINISTRATOR' }, select: { id: true } })
    const uploadedById = systemUser?.id ?? ''

    // Check for existing document of same type
    const existing = await prisma.document.findFirst({
      where: { seekerId: payload.seekerId, documentTypeId, deletedAt: null },
    })

    if (existing) {
      const doc = await prisma.document.update({
        where: { id: existing.id },
        data: {
          cloudinaryId: uploadResult.publicId,
          cloudinaryUrl: uploadResult.secureUrl,
          fileName: file.name,
          fileSize: file.size,
          fileFormat: file.type,
          status: 'PENDING',
          rejectionReason: null,
        },
      })
      return NextResponse.json({ success: true, data: doc })
    }

    const doc = await prisma.document.create({
      data: {
        seekerId: payload.seekerId,
        documentTypeId,
        uploadedById,
        cloudinaryId: uploadResult.publicId,
        cloudinaryUrl: uploadResult.secureUrl,
        fileName: file.name,
        fileSize: file.size,
        fileFormat: file.type,
        folder,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, data: doc })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
