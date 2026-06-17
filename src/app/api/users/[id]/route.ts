import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { isAdminRole, hashPassword } from '@/lib/auth'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { AuthenticationError } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { getSafeErrorMessage } from '@/lib/safe-api-error'
import { logRoleAssignmentChange } from '@/lib/activity-logger'

const USER_ROLE_NAMES = new Set<string>(Object.values(UserRole))

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('READ_USER', request)
    const { id } = await params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requirePermission('UPDATE_USER', request)
    const { id } = await params

    const body = await request.json()
    const { name, email, password, role, isActive, selectedRoles, whatsappInstanceId, whatsappToken } = body

    if (selectedRoles !== undefined) {
      await requirePermission(['ASSIGN_ROLE', 'MANAGE_USER_ROLES'], request, { any: true })
    }
    
    // Hash the password if provided
    const hashedPassword = password ? await hashPassword(password) : undefined
    
    // Prepare update data - only include fields that are provided
    const updateData: {
      name?: string
      email?: string
      role?: UserRole
      isActive?: boolean
      password?: string
      whatsappInstanceId?: string | null
      whatsappToken?: string | null
    } = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role as UserRole
    if (isActive !== undefined) updateData.isActive = isActive
    if (whatsappInstanceId !== undefined) updateData.whatsappInstanceId = whatsappInstanceId || null
    if (whatsappToken !== undefined) updateData.whatsappToken = whatsappToken || null
    
    // Only include password if it's being updated
    if (hashedPassword) {
      updateData.password = hashedPassword
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (selectedRoles !== undefined) {
      const previousAssignments = await prisma.userRoleAssignment.findMany({
        where: { userId: id },
        include: { role: true },
      })
      const previousRoleIds = previousAssignments.map((a) => a.roleId)
      const previousRoleNames = previousAssignments.map((a) => a.role.name)

      await prisma.userRoleAssignment.deleteMany({
        where: { userId: id },
      })

      if (selectedRoles.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: selectedRoles.map((roleId: string) => ({
            userId: id,
            roleId,
            assignedBy: _user.id,
          })),
        })
        const assignedRoles = await prisma.role.findMany({
          where: { id: { in: selectedRoles } },
        })
        const firstRoleName = assignedRoles[0]?.name
        if (firstRoleName && USER_ROLE_NAMES.has(firstRoleName)) {
          await prisma.user.update({
            where: { id },
            data: { role: firstRoleName as UserRole },
          })
        }
        logRoleAssignmentChange(_user.id, request, {
          targetUserId: id,
          targetEmail: updatedUser.email,
          assignedRoleIds: selectedRoles,
          assignedRoleNames: assignedRoles.map((r) => r.name),
          previousRoleIds,
          previousRoleNames,
        }).catch(() => {})
      }
    }

    // Fetch the updated user with all relations
    const finalUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Don't return the password
    const { password: _, ...userWithoutPassword } = finalUser!
    return NextResponse.json(userWithoutPassword)
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
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requirePermission('DELETE_USER', request)
    const { id } = await params

    if (_user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (isAdminRole(userToDelete.role)) {
      await requirePermission('DELETE_ADMINISTRATOR', request)
      const adminCount = await prisma.user.count({
        where: {
          role: { in: ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER'] },
          isActive: true
        }
      })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        )
      }
    }
    
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return handleApiError(error)
  }
}
