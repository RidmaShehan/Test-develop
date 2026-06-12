import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'

// PATCH /api/request-inquiries/[id] - Update request inquiry details (e.g. coordinator or addressee)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Get the exhibition visitor
    const visitor = await requestInquiryPrisma.exhibitionVisitor.findUnique({
      where: { id },
    })

    if (!visitor) {
      return NextResponse.json(
        { error: 'Request inquiry not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if ('addressee' in body) {
      updateData.addressee = body.addressee || null
    }
    if ('coordinatorId' in body) {
      updateData.coordinatorId = body.coordinatorId || null
    }
    if ('campaignId' in body) {
      updateData.campaignId = body.campaignId || null
    }

    const updatedVisitor = await requestInquiryPrisma.exhibitionVisitor.update({
      where: { id },
      data: updateData,
      include: {
        programs: {
          include: {
            program: true,
          },
        },
        metadata: true,
      },
    })

    return NextResponse.json({
      success: true,
      visitor: updatedVisitor,
    })
  } catch (error) {
    console.error('Error updating request inquiry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update request inquiry' },
      { status: 500 }
    )
  }
}
