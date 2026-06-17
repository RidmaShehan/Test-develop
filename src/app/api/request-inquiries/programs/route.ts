import { NextRequest, NextResponse } from 'next/server'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/handle-api-error'

// GET /api/request-inquiries/programs - Get all available programs
export async function GET(request: NextRequest) {
  try {
    // Public endpoint: rate limit by IP (60 requests per minute)
    const clientIp = getClientIp(request)
    const isAllowed = await rateLimit(`public:programs:${clientIp}`, {
      limit: 60,
      windowSeconds: 60,
    })

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const programs = await requestInquiryPrisma.program.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { programName: 'asc' },
      ],
    })

    return NextResponse.json(programs, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
