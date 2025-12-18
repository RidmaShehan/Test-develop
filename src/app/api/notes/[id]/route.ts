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

    const note = await prisma.note.findFirst({
      where: {
        id,
        createdById: user.id // Users can only access their own notes
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        notebook: {
          select: { id: true, title: true }
        },
        parentNote: {
          select: { id: true, title: true }
        },
        childNotes: {
          where: {
            isArchived: false
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
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { error: 'Failed to fetch note' },
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
      content,
      icon,
      coverImage,
      isArchived,
      isFavorite,
      order,
      notebookId,
      parentNoteId,
      hasReminder,
      reminderDate
    } = body

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        createdById: user.id
      }
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    // If notebookId is provided, verify it belongs to user
    if (notebookId !== undefined) {
      if (notebookId) {
        const notebook = await prisma.notebook.findFirst({
          where: {
            id: notebookId,
            createdById: user.id
          }
        })

        if (!notebook) {
          return NextResponse.json(
            { error: 'Notebook not found' },
            { status: 404 }
          )
        }
      }
    }

    // If parentNoteId is provided, verify it belongs to user and is not the same note
    if (parentNoteId !== undefined) {
      if (parentNoteId) {
        if (parentNoteId === id) {
          return NextResponse.json(
            { error: 'Note cannot be its own parent' },
            { status: 400 }
          )
        }

        const parentNote = await prisma.note.findFirst({
          where: {
            id: parentNoteId,
            createdById: user.id
          }
        })

        if (!parentNote) {
          return NextResponse.json(
            { error: 'Parent note not found' },
            { status: 404 }
          )
        }
      }
    }

    // Update note
    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(icon !== undefined && { icon }),
        ...(coverImage !== undefined && { coverImage }),
        ...(isArchived !== undefined && { isArchived }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(order !== undefined && { order }),
        ...(notebookId !== undefined && { notebookId: notebookId || null }),
        ...(parentNoteId !== undefined && { parentNoteId: parentNoteId || null }),
        ...(hasReminder !== undefined && { hasReminder }),
        ...(reminderDate !== undefined && { reminderDate: reminderDate ? new Date(reminderDate) : null })
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        notebook: {
          select: { id: true, title: true }
        },
        parentNote: {
          select: { id: true, title: true }
        },
        childNotes: {
          where: {
            isArchived: false
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: 'Failed to update note' },
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

    // Check if note exists and belongs to user
    const note = await prisma.note.findFirst({
      where: {
        id,
        createdById: user.id
      }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    // Delete note (cascade will delete all child notes)
    await prisma.note.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}

