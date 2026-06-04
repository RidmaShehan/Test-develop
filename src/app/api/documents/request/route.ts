import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { sendDocumentRequestEmail } from '@/lib/email'
import { AuthenticationError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('MANAGE_DOCUMENTS', req)
    const body = await req.json()
    const { seekerId, documentTypeId, message, dueDate } = body

    if (!seekerId || !documentTypeId) {
      return NextResponse.json({ error: 'seekerId and documentTypeId are required' }, { status: 400 })
    }

    const [seeker, docType] = await Promise.all([
      prisma.seeker.findUnique({ where: { id: seekerId } }),
      prisma.documentType.findUnique({ where: { id: documentTypeId } }),
    ])

    if (!seeker) return NextResponse.json({ error: 'Seeker not found' }, { status: 404 })
    if (!docType) return NextResponse.json({ error: 'Document type not found' }, { status: 404 })

    // Upsert document request
    const existing = await prisma.documentRequest.findFirst({
      where: { seekerId, documentTypeId, fulfilled: false },
    })

    const request = existing
      ? await prisma.documentRequest.update({
          where: { id: existing.id },
          data: { message, dueDate: dueDate ? new Date(dueDate) : null, reminderCount: 0 },
        })
      : await prisma.documentRequest.create({
          data: {
            seekerId,
            documentTypeId,
            requestedById: user.id,
            message,
            dueDate: dueDate ? new Date(dueDate) : null,
          },
        })

    if (seeker.email) {
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
      try {
        await sendDocumentRequestEmail({
          toEmail: seeker.email,
          toName: seeker.fullName,
          documentName: docType.name,
          programName: 'your enrolled program',
          counselorName: user.name,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          portalLink: `${APP_URL}/portal/${seeker.id}`,
          message,
        })
      } catch (emailErr) {
        console.warn('Email failed (non-critical):', emailErr)
      }
    }

    return NextResponse.json({ success: true, data: request }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
