import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const levels = await prisma.level.findMany({
      include: {
        _count: {
          select: {
            programs: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return NextResponse.json(levels)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const body = await request.json()
    const { name, description, isVisible, sortOrder } = body
    
    const level = await prisma.level.create({
      data: {
        name,
        description,
        isVisible: isVisible ?? true,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json(level, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
