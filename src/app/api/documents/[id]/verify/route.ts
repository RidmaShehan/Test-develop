import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { sendDocumentVerifiedEmail, sendDocumentRejectedEmail } from '@/lib/email'
import { AuthenticationError } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('MANAGE_DOCUMENTS', req)
    const { id } = await params
    const body = await req.json()
    const { action, reason } = body

    if (!['VERIFY', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'action must be VERIFY or REJECT' }, { status: 400 })
    }

    if (action === 'REJECT' && (!reason || reason.length < 10)) {
      return NextResponse.json({ error: 'Please provide a clear rejection reason (min 10 chars)' }, { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: { id, deletedAt: null },
      include: { seeker: true, documentType: true },
    })
    if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
        verifiedById: action === 'VERIFY' ? user.id : null,
        rejectionReason: action === 'REJECT' ? reason : null,
      },
      include: {
        documentType: true,
        verifiedBy: { select: { id: true, name: true } },
      },
    })

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const portalLink = `${APP_URL}/portal/${document.seeker.id}`

    if (document.seeker.email) {
      try {
        if (action === 'VERIFY') {
          await sendDocumentVerifiedEmail({
            toEmail: document.seeker.email,
            toName: document.seeker.fullName,
            documentName: document.documentType.name,
            programName: 'your enrolled program',
          })
        } else {
          await sendDocumentRejectedEmail({
            toEmail: document.seeker.email,
            toName: document.seeker.fullName,
            documentName: document.documentType.name,
            reason,
            portalLink,
          })
        }
      } catch (emailErr) {
        console.warn('Email notification failed (non-critical):', emailErr)
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
