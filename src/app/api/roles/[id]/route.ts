import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { AuthenticationError } from '@/lib/auth'
import { logRolePermissionChange } from '@/lib/activity-logger'

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('READ_ROLE', request)
    const { id } = await params

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
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return handleApiError(error)
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requirePermission('UPDATE_ROLE', request)
    const { id } = await params

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

    if (permissions !== undefined) {
      const previousPermissions = existingRole
        ? (await prisma.rolePermission.findMany({
            where: { roleId: id },
            include: { permission: true },
          })).map((rp) => rp.permission.name)
        : []

      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      })

      if (permissions.length > 0) {
        const permissionRecords = await Promise.all(
          permissions.map(async (permissionName: string) => {
            let permission = await prisma.permissionModel.findFirst({
              where: { name: permissionName as any },
            })
            if (!permission) {
              permission = await prisma.permissionModel.create({
                data: {
                  name: permissionName as any,
                  description: `Permission for ${permissionName}`,
                },
              })
            }
            return permission
          })
        )
        await prisma.rolePermission.createMany({
          data: permissionRecords.map((p) => ({
            roleId: id,
            permissionId: p.id,
          })),
        })
      }

      logRolePermissionChange(_user.id, request, {
        roleId: id,
        roleName: existingRole.name,
        permissionNames: permissions,
        previousPermissionNames: previousPermissions,
      }).catch(() => {})
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
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return handleApiError(error)
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('DELETE_ROLE', request)
    const { id } = await params

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
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return handleApiError(error)
  }
}