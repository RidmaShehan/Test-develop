import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Build where clause - users can only see their own notebooks
    const where: any = {
      createdById: user.id,
      isArchived: false
    }
    
    // Get notebooks
    const notebooks = await prisma.notebook.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            notes: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(notebooks)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const {
      title,
      description,
      icon,
      color
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Notebook title is required' },
        { status: 400 }
      )
    }

    // Create notebook
    const notebook = await prisma.notebook.create({
      data: {
        title,
        description,
        icon,
        color,
        createdById: user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(notebook, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

