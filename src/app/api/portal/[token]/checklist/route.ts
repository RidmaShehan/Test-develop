import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken } from '@/lib/portal-token'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const payload = verifyPortalToken(params.token)
  if (!payload) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 })

  const seeker = await prisma.seeker.findUnique({
    where: { id: payload.seekerId },
    include: {
      programInterest: {
        include: {
          documentRequirements: {
            include: { documentType: true },
          },
        },
      },
      documents: {
        where: { deletedAt: null },
        include: { documentType: true },
        orderBy: { createdAt: 'desc' },
      },
      documentRequests: {
        where: { fulfilled: false },
        include: { documentType: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!seeker) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const requirements = seeker.programInterest?.documentRequirements ?? []
  const uploaded = seeker.documents
  const pendingRequests = seeker.documentRequests

  const checklist = requirements.map((req: any) => {
    const docs = uploaded.filter((d: any) => d.documentTypeId === req.documentTypeId)
    const latestDoc = docs[0] ?? null
    const request = pendingRequests.find((r: any) => r.documentTypeId === req.documentTypeId) ?? null

    return {
      documentTypeId: req.documentTypeId,
      documentType: req.documentType,
      required: req.required,
      document: latestDoc
        ? { id: latestDoc.id, status: latestDoc.status, rejectionReason: latestDoc.rejectionReason, originalName: latestDoc.fileName }
        : null,
      request: request ? { id: request.id, dueDate: request.dueDate, message: request.message } : null,
    }
  })

  const total = checklist.filter((c: any) => c.required).length
  const verified_count = checklist.filter((c: any) => c.required && c.document && c.document.status === 'VERIFIED').length
  const pending_count = checklist.filter((c: any) => c.required && (!c.document || c.document.status !== 'VERIFIED')).length

  return NextResponse.json({ success: true, data: { checklist, summary: { total, uploaded: verified_count, pending: pending_count } } })
}
