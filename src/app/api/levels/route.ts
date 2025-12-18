import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try {
    const _user = await requireRole('ADMIN')
    
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
    console.error('Error fetching levels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch levels' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const _user = await requireRole('ADMIN')
    
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
    console.error('Error creating level:', error)
    return NextResponse.json(
      { error: 'Failed to create level' },
      { status: 500 }
    )
  }
}
