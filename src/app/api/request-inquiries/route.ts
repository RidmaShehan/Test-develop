import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'

// GET /api/request-inquiries - Get all request inquiries (exhibition visitors)
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    
    // Fetch both visitors and main system users in parallel
    const [visitors, users] = await Promise.all([
      requestInquiryPrisma.exhibitionVisitor.findMany({
        include: {
          programs: {
            include: {
              program: true,
            },
          },
          metadata: true,
        },
        orderBy: [
          { isConverted: 'asc' }, // Non-converted first
          { createdAt: 'desc' },   // Then by creation date (newest first)
        ],
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
    ])

    // Create a map of userId -> userName
    const userMap = new Map(users.map((u) => [u.id, u.name]))

    // Add coordinatorName to each visitor
    const visitorsWithCoordinators = visitors.map((visitor: any) => ({
      ...visitor,
      coordinatorName: visitor.coordinatorId ? (userMap.get(visitor.coordinatorId) || null) : null,
    }))

    return NextResponse.json(visitorsWithCoordinators)
  } catch (error) {
    console.error('Error fetching request inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request inquiries' },
      { status: 500 }
    )
  }
}

// POST /api/request-inquiries - Create a new request inquiry (exhibition visitor)
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()

    const visitor = await requestInquiryPrisma.exhibitionVisitor.create({
      data: {
        name: body.name,
        workPhone: body.workPhone,
        addressee: body.addressee || null,
        coordinatorId: body.coordinatorId || null,
        programs: body.programIds && body.programIds.length > 0 ? {
          create: body.programIds.map((programId: number) => ({
            programId: programId,
          })),
        } : undefined,
        metadata: body.metadata ? {
          create: {
            ipAddress: body.metadata.ipAddress || null,
            country: body.metadata.country || null,
            city: body.metadata.city || null,
            region: body.metadata.region || null,
            timezone: body.metadata.timezone || null,
            userAgent: body.metadata.userAgent || null,
            browser: body.metadata.browser || null,
            device: body.metadata.device || null,
            submissionDate: body.metadata.submissionDate ? new Date(body.metadata.submissionDate) : null,
            submissionTime: body.metadata.submissionTime ? new Date(`1970-01-01T${body.metadata.submissionTime}`) : null,
          },
        } : undefined,
      },
      include: {
        programs: {
          include: {
            program: true,
          },
        },
        metadata: true,
      },
    })

    return NextResponse.json(visitor, { status: 201 })
  } catch (error) {
    console.error('Error creating request inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create request inquiry' },
      { status: 500 }
    )
  }
}
