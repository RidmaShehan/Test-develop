import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { createInquiryFromBody } from '@/lib/inquiry-create-internal'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'

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
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }
    
    // Build where clause: admins (role or permission-based) see all inquiries; others only their own
    // Treat legacy rows where isDeleted might be NULL as "not deleted"
    // (Some older DB rows may have NULL even if Prisma schema is non-nullable)
    const where: Record<string, any> = {
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
    console.error('❌ ERROR in /api/inquiries:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return proper JSON error response
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: error.message,
          details: error.stack,
          route: '/api/inquiries'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch seekers' },
      { status: 500 }
    )
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

    console.error('Error creating inquiry:', error)

    // Return proper JSON error response
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 })
  }
}