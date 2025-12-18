import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Build where clause based on user role
    const where: any = { id }
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own projects or projects they're members of
    if (!isAdminRole(user.role)) {
      where.OR = [
        { createdById: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }

    const project = await prisma.project.findFirst({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: {
                subtasks: true,
                checklists: true,
                comments: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        deals: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true }
            },
            client: true,
            _count: {
              select: {
                activities: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            tasks: true,
            deals: true,
            members: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      progress,
      color
    } = body

    // Check if user has permission to update this project
    const where: any = { id }
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only allow updating own projects or projects they're members of
    if (!isAdminRole(user.role)) {
      where.OR = [
        { createdById: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }
    
    const existingProject = await prisma.project.findFirst({
      where
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (budget !== undefined) updateData.budget = budget
    if (progress !== undefined) updateData.progress = progress
    if (color !== undefined) updateData.color = color

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
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

    // Check if user is the creator of the project or is Admin/Administrator
    const where: any = { id }
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only allow deleting own projects
    if (!isAdminRole(user.role)) {
      where.createdById = user.id
    }
    
    const project = await prisma.project.findFirst({
      where
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
