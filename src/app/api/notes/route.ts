import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const notebookId = searchParams.get('notebookId')
    const parentNoteId = searchParams.get('parentNoteId')
    
    // Build where clause - users can only see their own notes
    const where: any = {
      createdById: user.id,
      isArchived: false
    }

    if (notebookId) {
      where.notebookId = notebookId
    }

    if (parentNoteId) {
      where.parentNoteId = parentNoteId
    } else if (parentNoteId === null || !parentNoteId) {
      // If no parentNoteId specified, get top-level notes
      where.parentNoteId = null
    }
    
    // Get notes
    const notes = await prisma.note.findMany({
      where,
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
        _count: {
          select: {
            childNotes: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
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
      content,
      notebookId,
      parentNoteId,
      icon,
      coverImage,
      order,
      hasReminder,
      reminderDate
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Note title is required' },
        { status: 400 }
      )
    }

    // If notebookId is provided, verify it belongs to user
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

    // If parentNoteId is provided, verify it belongs to user
    if (parentNoteId) {
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

    // Create note
    const note = await prisma.note.create({
      data: {
        title,
        content,
        notebookId: notebookId || null,
        parentNoteId: parentNoteId || null,
        icon,
        coverImage,
        order: order || 0,
        hasReminder: hasReminder || false,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        createdById: user.id
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
        }
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

