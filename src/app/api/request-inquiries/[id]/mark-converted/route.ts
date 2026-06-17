import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'

// POST /api/request-inquiries/[id]/mark-converted - Mark exhibition visitor as converted
// This is called after an inquiry has been created from the form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Get the exhibition visitor
    const visitor = await requestInquiryPrisma.exhibitionVisitor.findUnique({
      where: { id },
    })

    if (!visitor) {
      return NextResponse.json(
        { error: 'Exhibition visitor not found' },
        { status: 404 }
      )
    }

    // Check if already converted
    if (visitor.isConverted) {
      return NextResponse.json({
        success: true,
        visitor: {
          ...visitor,
          isConverted: true,
        },
        message: 'Visitor was already marked as converted',
      })
    }

    // Mark visitor as converted in the database
    const updatedVisitor = await requestInquiryPrisma.exhibitionVisitor.update({
      where: { id },
      data: {
        isConverted: true,
        convertedAt: new Date(),
      },
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
    if (error instanceof Error) {
      return handleApiError(error)
    }
    return handleApiError(error)
  }
}

