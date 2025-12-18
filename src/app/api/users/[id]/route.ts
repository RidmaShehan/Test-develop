import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireRole, hashPassword } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireRole('ADMIN', request)
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
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireRole('ADMIN', request)
    const { id } = await params
    
    const body = await request.json()
    const { name, email, password, role, isActive, selectedRoles } = body
    
    // Hash the password if provided
    const hashedPassword = password ? await hashPassword(password) : undefined
    
    // Prepare update data - only include fields that are provided
    const updateData: {
      name?: string
      email?: string
      role?: UserRole
      isActive?: boolean
      password?: string
    } = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role as UserRole
    if (isActive !== undefined) updateData.isActive = isActive
    
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

    // Update user roles if provided
    if (selectedRoles !== undefined) {
      // Delete existing role assignments
      await prisma.userRoleAssignment.deleteMany({
        where: { userId: id }
      })
      
      // Create new role assignments
      if (selectedRoles.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: selectedRoles.map((roleId: string) => ({
            userId: id,
            roleId,
            assignedBy: _user.id,
          }))
        })
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
    console.error('Error updating user:', error)
    
    // Handle unique constraint violation for email
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireRole('ADMIN', request)
    const { id } = await params

    // Prevent deleting yourself
    if (_user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting the last admin role user
    if (isAdminRole(userToDelete.role)) {
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
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
