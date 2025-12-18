import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if user has READ_ROLE permission
    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        role: {
          users: {
            some: {
              userId: user.id
            }
          }
        },
        permission: {
          name: 'READ_ROLE'
        }
      }
    })

    if (!hasPermission && !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to read role details' },
        { status: 403 }
      )
    }
    
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description
      })),
      userCount: role.users.length,
      users: role.users.map(ur => ur.user),
      _count: {
        users: role.users.length,
        permissions: role.permissions.length
      }
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if user has UPDATE_ROLE permission
    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        role: {
          users: {
            some: {
              userId: user.id
            }
          }
        },
        permission: {
          name: 'UPDATE_ROLE'
        }
      }
    })

    if (!hasPermission && !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update roles' },
        { status: 403 }
      )
    }
    
    const { name, description, permissions } = await request.json()

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing role
    if (name && name !== existingRole.name) {
      const nameConflict = await prisma.role.findFirst({
        where: {
          name: name.toUpperCase(),
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(description !== undefined && { description }),
        updatedAt: new Date()
      }
    })

    // Update permissions if provided
    if (permissions !== undefined) {
      // Remove existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      })

      // Add new permissions
      if (permissions.length > 0) {
        const permissionRecords = await Promise.all(
          permissions.map(async (permissionName: string) => {
            let permission = await prisma.permissionModel.findFirst({
              where: { name: permissionName as any }
            })

            if (!permission) {
              permission = await prisma.permissionModel.create({
                data: {
                  name: permissionName as any,
                  description: `Permission for ${permissionName}`
                }
              })
            }

            return permission
          })
        )

        await prisma.rolePermission.createMany({
          data: permissionRecords.map(permission => ({
            roleId: id,
            permissionId: permission.id
          }))
        })
      }
    }

    // Fetch the updated role with permissions
    const finalRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: true
      }
    })

    return NextResponse.json({
      id: finalRole!.id,
      name: finalRole!.name,
      description: finalRole!.description,
      isActive: finalRole!.isActive,
      createdAt: finalRole!.createdAt,
      updatedAt: finalRole!.updatedAt,
      permissions: finalRole!.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description
      })),
      userCount: finalRole!.users.length,
      users: finalRole!.users.map((ur: any) => ur.user),
      _count: {
        users: finalRole!.users.length,
        permissions: finalRole!.permissions.length
      }
    })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if user has DELETE_ROLE permission
    const hasPermission = await prisma.rolePermission.findFirst({
      where: {
        role: {
          users: {
            some: {
              userId: user.id
            }
          }
        },
        permission: {
          name: 'DELETE_ROLE'
        }
      }
    })

    if (!hasPermission && !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete roles' },
        { status: 403 }
      )
    }
    
    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        users: true
      }
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // Check if role has users assigned
    if (existingRole.users.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Please reassign users first.' },
        { status: 400 }
      )
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id }
    })

    // Delete the role
    await prisma.role.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}