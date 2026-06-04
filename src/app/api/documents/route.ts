import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary, getStudentFolder, DocumentCategory } from '@/lib/cloudinary'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission('READ_DOCUMENTS', req)

    const seekerId = req.nextUrl.searchParams.get('seekerId')
    if (!seekerId) return NextResponse.json({ error: 'seekerId required' }, { status: 400 })

    const documents = await prisma.document.findMany({
      where: { seekerId, deletedAt: null },
      include: {
        documentType: true,
        uploadedBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        versions: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: documents })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('MANAGE_DOCUMENTS', req)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const seekerId = formData.get('seekerId') as string
    const documentTypeId = formData.get('documentTypeId') as string
    const category = (formData.get('category') as string) || 'OTHER'
    const notes = (formData.get('notes') as string) || undefined
    const expiryDate = (formData.get('expiryDate') as string) || undefined

    if (!seekerId || !documentTypeId) {
      return NextResponse.json({ error: 'seekerId and documentTypeId are required' }, { status: 400 })
    }

    const [docType, seeker] = await Promise.all([
      prisma.documentType.findUnique({ where: { id: documentTypeId } }),
      prisma.seeker.findUnique({ where: { id: seekerId } }),
    ])

    if (!docType) return NextResponse.json({ error: 'Document type not found' }, { status: 404 })
    if (!seeker) return NextResponse.json({ error: 'Seeker not found' }, { status: 404 })

    const maxBytes = docType.maxSizeMb * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `File too large. Max ${docType.maxSizeMb}MB allowed.` }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedFormats = docType.acceptedFormats.split(',').map((f) => f.trim())
    if (!allowedFormats.includes(fileExt)) {
      return NextResponse.json(
        { error: `Format .${fileExt} not allowed. Accepted: ${docType.acceptedFormats}` },
        { status: 400 }
      )
    }

    const folder = getStudentFolder(seekerId, category.toLowerCase() as DocumentCategory)
    const fileName = `${docType.code}_${Date.now()}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const uploaded = await uploadToCloudinary(buffer, {
      folder,
      fileName,
      resourceType: fileExt === 'pdf' ? 'raw' : 'image',
      tags: ['educrm', 'document', seekerId, docType.code],
    })

    // Check for existing document of same type
    const existing = await prisma.document.findFirst({
      where: { seekerId, documentTypeId, deletedAt: null },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    })

    if (existing) {
      const nextVersion = (existing.versions[0]?.versionNumber ?? 0) + 1
      await prisma.$transaction([
        prisma.documentVersion.create({
          data: {
            documentId: existing.id,
            versionNumber: nextVersion,
            cloudinaryId: uploaded.publicId,
            cloudinaryUrl: uploaded.secureUrl,
            fileSize: uploaded.bytes,
            uploadedById: user.id,
            notes: `Version ${nextVersion} uploaded`,
          },
        }),
        prisma.document.update({
          where: { id: existing.id },
          data: {
            cloudinaryId: uploaded.publicId,
            cloudinaryUrl: uploaded.secureUrl,
            thumbnailUrl: uploaded.thumbnailUrl,
            fileSize: uploaded.bytes,
            fileFormat: fileExt,
            status: 'PENDING',
            verifiedById: null,
            rejectionReason: null,
            ...(expiryDate && { expiryDate: new Date(expiryDate) }),
          },
        }),
      ])

      await prisma.documentRequest.updateMany({
        where: { seekerId, documentTypeId, fulfilled: false },
        data: { fulfilled: true },
      })

      const updated = await prisma.document.findUnique({
        where: { id: existing.id },
        include: {
          documentType: true,
          uploadedBy: { select: { id: true, name: true } },
          versions: { orderBy: { versionNumber: 'desc' } },
        },
      })

      return NextResponse.json({ success: true, data: updated, message: 'New version uploaded' })
    }

    const document = await prisma.document.create({
      data: {
        seekerId,
        documentTypeId,
        uploadedById: user.id,
        cloudinaryId: uploaded.publicId,
        cloudinaryUrl: uploaded.secureUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        fileName: file.name,
        fileSize: uploaded.bytes,
        fileFormat: fileExt,
        folder: uploaded.folder,
        status: 'PENDING',
        notes,
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
      },
      include: {
        documentType: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    })

    await prisma.documentRequest.updateMany({
      where: { seekerId, documentTypeId, fulfilled: false },
      data: { fulfilled: true },
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    console.error('Document upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
