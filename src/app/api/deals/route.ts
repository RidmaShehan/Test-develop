import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const projectId = searchParams.get('projectId')
    const clientId = searchParams.get('clientId')

    const whereClause: Record<string, any> = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own deals or deals in their projects
    if (!isAdminRole(user.role)) {
      whereClause.OR = [
        { createdById: user.id },
        { assignedToId: user.id },
        { project: { members: { some: { userId: user.id } } } }
      ]
    }

    if (stage) {
      whereClause.stage = stage
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (clientId) {
      whereClause.clientId = clientId
    }

    const deals = await prisma.deal.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        client: true,
        activities: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { date: 'desc' }
        },
        _count: {
          select: {
            activities: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const {
      title,
      description,
      value,
      currency = 'USD',
      stage = 'LEAD',
      probability = 10,
      expectedCloseDate,
      source,
      projectId,
      assignedToId,
      clientId,
      tags
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Deal title is required' },
        { status: 400 }
      )
    }

    // Create deal
    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        value,
        currency,
        stage,
        probability,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        source,
        projectId,
        assignedToId,
        clientId,
        tags: tags ? JSON.stringify(tags) : null,
        createdById: user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true }
        },
        client: true
      }
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}
