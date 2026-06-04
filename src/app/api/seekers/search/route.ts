import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'

export async function GET(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!query || query.length < 2) {
      return NextResponse.json({ seekers: [] })
    }

    // Build where clause based on user role
    const where: any = {
      NOT: { isDeleted: true },
      OR: [
        { phone: { contains: query } },
        { fullName: { contains: query, mode: 'insensitive' } },
      ],
    }

    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }

    const seekers = await prisma.seeker.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phone: true,
        whatsapp: true,
        whatsappNumber: true,
        createdAt: true,
        email: true,
        city: true,
        ageBand: true,
        guardianPhone: true,
        marketingSource: true,
        preferredContactTime: true,
        preferredStatus: true,
        notAnswering: true,
        emailNotAnswering: true,
        consent: true,
        registerNow: true,
        preferredPrograms: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 1,
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ seekers })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Error searching seekers:', error)
    return NextResponse.json(
      { error: 'Failed to search seekers' },
      { status: 500 }
    )
  }
}

