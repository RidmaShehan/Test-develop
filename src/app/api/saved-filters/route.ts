import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') || 'inquiry'

    const filters = await prisma.savedFilter.findMany({
      where: {
        userId: user.id,
        entityType,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ filters })
  } catch (error) {
    console.error('Error fetching saved filters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved filters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { name, description, filterData, entityType = 'inquiry', isDefault = false } = body

    if (!name || !filterData) {
      return NextResponse.json(
        { error: 'Name and filterData are required' },
        { status: 400 }
      )
    }

    // Check if filter with same name exists for this user
    const existing = await prisma.savedFilter.findUnique({
      where: { userId_name: { userId: user.id, name } }
    })

    let savedFilter

    if (existing) {
      // Update existing
      savedFilter = await prisma.savedFilter.update({
        where: { id: existing.id },
        data: {
          description,
          filterData,
          isDefault,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new
      savedFilter = await prisma.savedFilter.create({
        data: {
          name,
          description,
          filterData,
          entityType,
          isDefault,
          userId: user.id,
        },
      })
    }

    return NextResponse.json({ filter: savedFilter })
  } catch (error) {
    console.error('Error saving filter:', error)
    return NextResponse.json(
      { error: 'Failed to save filter' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      )
    }

    await prisma.savedFilter.deleteMany({
      where: {
        id,
        userId: user.id, // Ensure user can only delete their own filters
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting filter:', error)
    return NextResponse.json(
      { error: 'Failed to delete filter' },
      { status: 500 }
    )
  }
}
