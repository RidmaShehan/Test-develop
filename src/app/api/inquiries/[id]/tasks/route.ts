import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const { id } = await params

    // Enforce RBAC: non-admins can only access tasks for inquiries they created
    const seekerWhere: any = { id, NOT: { isDeleted: true } }
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      seekerWhere.createdById = _user.id
    }
    const seeker = await prisma.seeker.findFirst({ where: seekerWhere, select: { id: true } })
    if (!seeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }

    const tasks = await prisma.followUpTask.findMany({
      where: {
        seekerId: id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    
    const body = await request.json()
    const { id } = await params

    // Enforce RBAC: non-admins can only create tasks for inquiries they created
    const seekerWhere: any = { id, NOT: { isDeleted: true } }
    if (!(await canViewAllInquiries(_user.id, _user.role))) {
      seekerWhere.createdById = _user.id
    }
    const seeker = await prisma.seeker.findFirst({ 
      where: seekerWhere, 
      select: { 
        id: true,
        fullName: true,
        stage: true,
      } 
    })
    if (!seeker) {
      return NextResponse.json(
        { error: 'Inquiry not found or access denied' },
        { status: 404 }
      )
    }
    
    // GUARD: Validate task creation using service layer
    // Prevents tasks for REGISTERED, NOT_INTERESTED, or COMPLETED seekers
    const { validateTaskCreation } = await import('@/lib/seeker-status-service')
    try {
      await validateTaskCreation(id)
    } catch (validationError) {
      const message = validationError instanceof Error 
        ? validationError.message 
        : 'Cannot create task for this seeker'
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }
    
    const task = await prisma.followUpTask.create({
      data: {
        ...body,
        seekerId: id,
        assignedTo: _user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}