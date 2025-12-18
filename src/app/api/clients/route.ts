import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const industry = searchParams.get('industry')

    const whereClause: Record<string, any> = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own clients
    if (!isAdminRole(user.role)) {
      whereClause.createdById = user.id
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (industry) {
      whereClause.industry = industry
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true
          }
        },
        _count: {
          select: {
            deals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      company,
      website,
      address,
      industry,
      size,
      notes,
      tags
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        company,
        website,
        address,
        industry,
        size,
        notes,
        tags: tags ? JSON.stringify(tags) : null,
        createdById: user.id
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
