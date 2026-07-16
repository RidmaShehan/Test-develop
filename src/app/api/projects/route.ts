import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own projects or projects they're members of
    if (!isAdminRole(user.role)) {
      where.OR = [
        { createdById: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }
    
    // Get projects based on user role and permissions
    const projects = await prisma.project.findMany({
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
        _count: {
          select: {
            tasks: true,
            deals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const {
      name,
      description,
      status = 'ACTIVE',
      priority = 'MEDIUM',
      startDate,
      endDate,
      budget,
      color,
      memberIds = []
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Build members creation array with roles
    const membersData: { userId: string; role: any }[] = []
    membersData.push({ userId: user.id, role: 'OWNER' })

    if (body.members && Array.isArray(body.members)) {
      body.members.forEach((m: any) => {
        if (m.userId && m.userId !== user.id) {
          const role = ['OWNER', 'MANAGER', 'CONTRIBUTOR', 'VIEWER'].includes(String(m.role).toUpperCase())
            ? String(m.role).toUpperCase()
            : 'CONTRIBUTOR'
          // Avoid duplicate member record if creator was explicitly passed in list
          if (!membersData.some(existing => existing.userId === m.userId)) {
            membersData.push({ userId: m.userId, role })
          }
        }
      })
    } else if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach((memberId: string) => {
        if (memberId !== user.id) {
          if (!membersData.some(existing => existing.userId === memberId)) {
            membersData.push({ userId: memberId, role: 'CONTRIBUTOR' })
          }
        }
      })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget,
        color,
        createdById: user.id,
        members: {
          create: membersData
        }
      },
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

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
