import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { createInquiryFromBody } from '@/lib/inquiry-create-internal'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'
import { ForbiddenError } from '@/lib/authorization'
import { handleApiError } from '@/lib/handle-api-error'

export async function GET(request: NextRequest) {
  try {
    // Pass request to requireAuth to get the actual logged-in user
    const _user = await requireAuth(request)
    
    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters. Limit must be between 1 and 1000.' },
        { status: 400 }
      )
    }
    
    // Build where clause: admins (role or permission-based) see all inquiries; others only their own
    // Treat legacy rows where isDeleted might be NULL as "not deleted"
    const where: Prisma.SeekerWhereInput = {
      NOT: { isDeleted: true },
    }
    
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      where.createdById = _user.id
    }

    // Optional: only inquiries linked to a promotion code (e.g. WhatsApp campaign "Promo" filter)
    const hasPromotionCodeParam = searchParams.get('hasPromotionCode')
    if (hasPromotionCodeParam === 'true' || hasPromotionCodeParam === '1') {
      where.promotionCodeId = { not: null }
    }

    // Use transaction to fetch data and count in parallel for better performance
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
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Pass request to requireAuth to get the actual logged-in user, not fallback admin
    const _user = await requireAuth(request)
    
    const body = await request.json()
    console.log('Received body:', body)

    // Duplicate phone numbers are allowed so teams can log multiple inquiries
    // for the same contact (e.g. different programs/campaigns/follow-ups).

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
    return handleApiError(error)
  }
}