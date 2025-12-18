import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/inquiries/trash - List deleted inquiries for current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const inquiries = await prisma.seeker.findMany({
      where: {
        isDeleted: true,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    })

    return NextResponse.json(inquiries)
  } catch (error) {
    console.error('Error fetching deleted inquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch deleted inquiries' }, { status: 500 })
  }
}


