import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const { id } = await params
    const level = await prisma.level.findUnique({
      where: { id: id },
      include: {
        programs: {
          include: {
            _count: {
              select: {
                seekers: true,
              },
            },
          },
        },
        _count: {
          select: {
            programs: true,
          },
        },
      },
    })

    if (!level) {
      return NextResponse.json(
        { error: 'Level not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(level)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const body = await request.json()
    const { name, description, isVisible, sortOrder } = body
    const { id } = await params
    
    const level = await prisma.level.update({
      where: { id: id },
      data: {
        name,
        description,
        isVisible,
        sortOrder,
      },
    })

    return NextResponse.json(level)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const { id } = await params
    // Check if level has programs
    const programsCount = await prisma.program.count({
      where: { levelId: id },
    })

    if (programsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete level with existing programs' },
        { status: 400 }
      )
    }

    await prisma.level.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: 'Level deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
