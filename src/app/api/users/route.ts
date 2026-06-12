import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hashPassword } from '@/lib/auth'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { AuthenticationError } from '@/lib/auth'
import { getSafeErrorMessage } from '@/lib/safe-api-error'
import { logRoleAssignmentChange } from '@/lib/activity-logger'

const USER_ROLE_NAMES = new Set<string>(Object.values(UserRole))

export async function GET(request: NextRequest) {
  try {
    await requirePermission('READ_USER', request)

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
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Failed to fetch users') },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const _user = await requirePermission('CREATE_USER', request)

    const body = await request.json()
    const { name, email, password, role, clerkId, roles, whatsappInstanceId, whatsappToken } = body
    
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
        whatsappInstanceId: whatsappInstanceId || null,
        whatsappToken: whatsappToken || null,
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

    // Keep User.role in sync with first assigned role when it matches UserRole enum
    if (newUser.userRoles?.length > 0) {
      const firstRoleName = newUser.userRoles[0].role.name
      if (USER_ROLE_NAMES.has(firstRoleName)) {
        const roleValue = firstRoleName as UserRole
        await prisma.user.update({
          where: { id: newUser.id },
          data: { role: roleValue },
        })
        newUser.role = roleValue
      }
    }

    if (roles?.length) {
      logRoleAssignmentChange(_user.id, request, {
        targetUserId: newUser.id,
        targetEmail: newUser.email,
        assignedRoleIds: roles,
        assignedRoleNames: newUser.userRoles.map((ur) => ur.role.name),
      }).catch(() => {})
    }

    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Failed to create user') },
      { status: 500 }
    )
  }
}
