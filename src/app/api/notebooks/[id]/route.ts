import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const notebook = await prisma.notebook.findFirst({
      where: {
        id,
        createdById: user.id // Users can only access their own notebooks
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        notes: {
          where: {
            isArchived: false,
            parentNoteId: null // Only top-level notes
          },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: {
                childNotes: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            notes: true
          }
        }
      }
    })

    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(notebook)
  } catch (error) {
    console.error('Error fetching notebook:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebook' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const {
      title,
      description,
      icon,
      color,
      isArchived
    } = body

    // Check if notebook exists and belongs to user
    const existingNotebook = await prisma.notebook.findFirst({
      where: {
        id,
        createdById: user.id
      }
    })

    if (!existingNotebook) {
      return NextResponse.json(
        { error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Update notebook
    const notebook = await prisma.notebook.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isArchived !== undefined && { isArchived })
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(notebook)
  } catch (error) {
    console.error('Error updating notebook:', error)
    return NextResponse.json(
      { error: 'Failed to update notebook' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if notebook exists and belongs to user
    const notebook = await prisma.notebook.findFirst({
      where: {
        id,
        createdById: user.id
      }
    })

    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook not found' },
        { status: 404 }
      )
    }

    // Delete notebook (cascade will delete all notes)
    await prisma.notebook.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Notebook deleted successfully' })
  } catch (error) {
    console.error('Error deleting notebook:', error)
    return NextResponse.json(
      { error: 'Failed to delete notebook' },
      { status: 500 }
    )
  }
}

