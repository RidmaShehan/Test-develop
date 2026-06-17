import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// Helper function to generate next promotion code (A0001, A0002, etc.)
async function generateNextCode(): Promise<string> {
  // Get the highest existing code
  const lastCode = await prisma.promotionCode.findFirst({
    orderBy: { code: 'desc' },
    select: { code: true },
  })

  if (!lastCode) {
    return 'A0001'
  }

  // Extract the number part (e.g., "A0001" -> 1)
  const match = lastCode.code.match(/^A(\d+)$/)
  if (!match) {
    // If format is unexpected, start from A0001
    return 'A0001'
  }

  const nextNumber = parseInt(match[1], 10) + 1
  // Format as A0001, A0002, etc. (4 digits)
  return `A${nextNumber.toString().padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { promoterName: { contains: search, mode: 'insensitive' } },
        { promoterPhone: { contains: search, mode: 'insensitive' } },
        { promoterIdNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [promotionCodes, total] = await prisma.$transaction([
      prisma.promotionCode.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              seekers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promotionCode.count({ where }),
    ])

    // Calculate actual inquiries and registrations
    const codesWithStats = await Promise.all(
      promotionCodes.map(async (code) => {
        const seekers = await prisma.seeker.findMany({
          where: { promotionCodeId: code.id },
          select: {
            id: true,
            stage: true,
          },
        })

        const totalInquiries = seekers.length
        const totalRegistrations = seekers.filter(
          (s) => s.stage === 'READY_TO_REGISTER'
        ).length

        return {
          ...code,
          totalInquiries,
          totalRegistrations,
          // Calculate total paid: paymentAmountLKR * totalRegistrations
          totalPaidLKR: code.paymentAmountLKR * totalRegistrations,
        }
      })
    )

    return NextResponse.json({
      promotionCodes: codesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const {
      promoterName,
      promoterAddress,
      promoterPhone,
      promoterIdNumber,
      discountAmountLKR,
      paymentAmountLKR,
      isActive = true,
    } = body

    // Validate required fields
    if (!promoterName || !promoterAddress || !promoterPhone || !promoterIdNumber) {
      return NextResponse.json(
        { error: 'All promoter details are required' },
        { status: 400 }
      )
    }

    if (discountAmountLKR === undefined || discountAmountLKR < 0) {
      return NextResponse.json(
        { error: 'Discount amount must be a positive number' },
        { status: 400 }
      )
    }

    if (paymentAmountLKR === undefined || paymentAmountLKR < 0) {
      return NextResponse.json(
        { error: 'Payment amount must be a positive number' },
        { status: 400 }
      )
    }

    // Generate next code
    const code = await generateNextCode()

    // Check if code already exists (shouldn't happen, but safety check)
    const existing = await prisma.promotionCode.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Code already exists. Please try again.' },
        { status: 409 }
      )
    }

    // Create promotion code
    const promotionCode = await prisma.promotionCode.create({
      data: {
        code,
        promoterName,
        promoterAddress,
        promoterPhone,
        promoterIdNumber,
        discountAmountLKR: parseFloat(discountAmountLKR),
        paymentAmountLKR: parseFloat(paymentAmountLKR),
        isActive,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(promotionCode, { status: 201 })
  } catch (error: any) {
    return handleApiError(error)
  }
}
