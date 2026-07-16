import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
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
    return handleApiError(error)
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

    // Check if task exists and user has OWNER role
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: { members: true }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const { getProjectUserRole } = await import('@/lib/project-permissions')
    const projectRole = await getProjectUserRole(id, user.id, user.role)

    if (projectRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only project Owners can update project details.' },
        { status: 403 }
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

    // Update project attributes
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    })

    // Handle project member sync with roles
    if (body.members && Array.isArray(body.members)) {
      const incomingMembers = body.members.map((m: any) => ({
        userId: m.userId,
        role: ['OWNER', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'].includes(String(m.role).toUpperCase())
          ? String(m.role).toUpperCase()
          : 'CONTRIBUTOR'
      }))

      // Always ensure the original project creator remains OWNER
      if (!incomingMembers.some((m: any) => m.userId === existingProject.createdById)) {
        incomingMembers.push({ userId: existingProject.createdById, role: 'OWNER' })
      }

      const incomingUserIds = incomingMembers.map((m: any) => m.userId)

      // Remove members no longer assigned
      await prisma.projectMember.deleteMany({
        where: {
          projectId: id,
          userId: { notIn: incomingUserIds }
        }
      })

      // Upsert new/updated members
      for (const member of incomingMembers) {
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: id,
              userId: member.userId
            }
          },
          update: { role: member.role },
          create: {
            projectId: id,
            userId: member.userId,
            role: member.role
          }
        })
      }
    } else if (body.memberIds && Array.isArray(body.memberIds)) {
      // Backward compatibility fallback using memberIds list
      const incomingUserIds = [...body.memberIds]
      if (!incomingUserIds.includes(existingProject.createdById)) {
        incomingUserIds.push(existingProject.createdById)
      }

      await prisma.projectMember.deleteMany({
        where: {
          projectId: id,
          userId: { notIn: incomingUserIds }
        }
      })

      for (const userId of incomingUserIds) {
        const isCreator = userId === existingProject.createdById
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: id,
              userId
            }
          },
          update: {},
          create: {
            projectId: id,
            userId,
            role: isCreator ? 'OWNER' : 'CONTRIBUTOR'
          }
        })
      }
    }

    // Return the updated project with full relationships loaded
    const fullProject = await prisma.project.findUnique({
      where: { id },
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

    // Log user activity
    const { logUserActivity } = await import('@/lib/audit')
    await logUserActivity({
      userId: user.id,
      activityType: 'PROJECT_ROLE_UPDATE',
      metadata: { projectId: id, action: 'sync_members' }
    })

    return NextResponse.json(fullProject)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const { getProjectUserRole } = await import('@/lib/project-permissions')
    const projectRole = await getProjectUserRole(id, user.id, user.role)

    if (projectRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized. Only project Owners can delete this project.' },
        { status: 403 }
      )
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
