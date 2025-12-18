import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// POST /api/inquiries/[id]/restore - Restore a deleted inquiry (creator only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const existing = await prisma.seeker.findFirst({
      where: {
        id,
        isDeleted: true,
        createdById: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Inquiry not found or access denied' }, { status: 404 })
    }

    const restored = await prisma.seeker.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
      },
    })

    return NextResponse.json({ message: 'Inquiry restored successfully', inquiry: restored })
  } catch (error) {
    console.error('Error restoring inquiry:', error)
    return NextResponse.json({ error: 'Failed to restore inquiry' }, { status: 500 })
  }
}


