import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET a single Q&A item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qaId: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { qaId } = await params

    const qaItem = await prisma.programQA.findUnique({
      where: { id: qaId },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            level: true,
            campus: true,
          },
        },
      },
    })

    if (!qaItem) {
      return NextResponse.json(
        { error: 'Q&A item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(qaItem)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT update a Q&A item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ qaId: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { qaId } = await params
    const body = await request.json()

    const qaItem = await prisma.programQA.update({
      where: { id: qaId },
      data: {
        question: body.question,
        answer: body.answer,
        order: body.order,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(qaItem)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE a Q&A item (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ qaId: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { qaId } = await params

    // Soft delete by setting isActive to false
    const qaItem = await prisma.programQA.update({
      where: { id: qaId },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({ message: 'Q&A item deleted successfully', qaItem })
  } catch (error) {
    return handleApiError(error)
  }
}

