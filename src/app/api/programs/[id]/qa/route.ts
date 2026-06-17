import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET all Q&A items for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { id: programId } = await params

    const qaItems = await prisma.programQA.findMany({
      where: {
        programId,
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json(qaItems)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST create a new Q&A item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { id: programId } = await params
    const body = await request.json()

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Get the max order value to add new item at the end
    const maxOrder = await prisma.programQA.findFirst({
      where: { programId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const qaItem = await prisma.programQA.create({
      data: {
        programId,
        question: body.question,
        answer: body.answer,
        order: (maxOrder?.order ?? -1) + 1,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    return NextResponse.json(qaItem, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
