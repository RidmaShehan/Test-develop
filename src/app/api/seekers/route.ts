import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { createInquiryFromBody } from '@/lib/inquiry-create-internal'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'
import { ForbiddenError } from '@/lib/authorization'

// GET /api/seekers - Forward to inquiries logic directly to avoid fetch-to-self 403s
export async function GET(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    const where: Record<string, any> = {
      NOT: { isDeleted: true },
    }
    
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }

    const [seekers, totalInquiries] = await prisma.$transaction([
      prisma.seeker.findMany({
        where,
        include: {
          programInterest: true,
          preferredPrograms: {
            include: {
              program: true,
            },
          },
          promotionCode: {
            select: {
              id: true,
              code: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          campaigns: {
            include: {
              campaign: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.seeker.count({ where }),
    ])

    const totalPages = Math.ceil(totalInquiries / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      inquiries: seekers,
      pagination: {
        total: totalInquiries,
        page,
        limit,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in /api/seekers GET:', error)
    return NextResponse.json({ error: 'Failed to fetch seekers' }, { status: 500 })
  }
}

// POST /api/seekers - Forward to inquiries logic directly
export async function POST(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    const body = await request.json()

    const seeker = await createInquiryFromBody({
      body,
      userId: _user.id,
      request,
    })

    return NextResponse.json(seeker, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in /api/seekers POST:', error)
    return NextResponse.json({ error: 'Failed to create seeker' }, { status: 500 })
  }
}
