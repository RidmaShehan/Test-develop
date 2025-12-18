import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            interactions: true,
            followUpTasks: true,
            assignedSeekers: true,
            userRoles: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const _user = await requireRole('ADMIN', request)
    
    const body = await request.json()
    const { name, email, password, role, clerkId, roles } = body
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    
    // Hash the password if provided
    const hashedPassword = password ? await hashPassword(password) : null
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        clerkId,
        userRoles: {
          create: roles?.map((roleId: string) => ({
            roleId,
            assignedBy: _user.id,
          })) || [],
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Don't return the password in the response
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
}
