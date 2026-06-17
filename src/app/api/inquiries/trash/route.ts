import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
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
    return handleApiError(error)
  }
}


