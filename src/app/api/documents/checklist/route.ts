import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_DOCUMENTS', req)

    const seekerId = req.nextUrl.searchParams.get('seekerId')
    const programId = req.nextUrl.searchParams.get('programId')

    if (!seekerId) return NextResponse.json({ error: 'seekerId required' }, { status: 400 })

    const [requirements, uploaded, requests] = await Promise.all([
      programId
        ? prisma.programDocumentRequirement.findMany({
            where: { programId },
            include: { documentType: true },
            orderBy: { documentType: { category: 'asc' } },
          })
        : Promise.resolve([]),
      prisma.document.findMany({
        where: { seekerId, deletedAt: null },
        include: {
          documentType: true,
          uploadedBy: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.documentRequest.findMany({
        where: { seekerId, fulfilled: false },
        include: {
          documentType: true,
          requestedBy: { select: { id: true, name: true } },
        },
      }),
    ])

    const uploadedMap = new Map(uploaded.map((d) => [d.documentTypeId, d]))

    const checklist = requirements.map((req) => ({
      documentType: req.documentType,
      isRequired: req.isRequired,
      notes: req.notes,
      uploaded: uploadedMap.get(req.documentTypeId) ?? null,
      status: uploadedMap.get(req.documentTypeId)?.status ?? 'MISSING',
      request: requests.find((r) => r.documentTypeId === req.documentTypeId) ?? null,
    }))

    const extraDocuments = uploaded.filter(
      (d) => !requirements.some((r) => r.documentTypeId === d.documentTypeId)
    )

    const requiredItems = checklist.filter((c) => c.isRequired)
    const verifiedRequired = requiredItems.filter((c) => c.status === 'VERIFIED').length

    const summary = {
      total: requirements.length,
      uploaded: checklist.filter((c) => c.uploaded).length,
      verified: checklist.filter((c) => c.status === 'VERIFIED').length,
      pending: checklist.filter((c) => c.status === 'PENDING').length,
      rejected: checklist.filter((c) => c.status === 'REJECTED').length,
      missing: checklist.filter((c) => !c.uploaded && c.isRequired).length,
      completePct: requiredItems.length
        ? Math.round((verifiedRequired / requiredItems.length) * 100)
        : 0,
    }

    return NextResponse.json({ success: true, data: { checklist, extraDocuments, requests, summary } })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
  }
}
