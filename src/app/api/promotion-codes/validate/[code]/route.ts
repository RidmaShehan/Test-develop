import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/handle-api-error'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Rate limit to prevent code enumeration (e.g. 30 requests per minute per IP)
    const clientIp = getClientIp(request)
    if (!(await rateLimit(clientIp, { limit: 30, windowSeconds: 60 }))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { code: codeParam } = await params
    const code = codeParam.toUpperCase().trim()

    const promotionCode = await prisma.promotionCode.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        discountAmountLKR: true,
        paymentAmountLKR: true,
        isActive: true,
      },
    })

    if (!promotionCode) {
      return NextResponse.json(
        { valid: false, error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    if (!promotionCode.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Promotion code is not active' },
        { status: 400 }
      )
    }

    // Return only data needed for checkout - no internal stats (totalInquiries, totalRegistrations, promoterName)
    return NextResponse.json({
      valid: true,
      code: promotionCode.code,
      discountAmountLKR: promotionCode.discountAmountLKR,
      paymentAmountLKR: promotionCode.paymentAmountLKR,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
