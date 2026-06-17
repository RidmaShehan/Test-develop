import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { AuthenticationError } from '@/lib/auth'

// GET /api/roles - Get all roles with permissions and user counts
export async function GET(request: NextRequest) {
  try {
    await requirePermission('READ_ROLE', request)

    const roles = await prisma.role.findMany({
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
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data to include permission names and user counts
    const transformedRoles = roles.map(role => ({
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
    }))

    return NextResponse.json(transformedRoles)
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

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    await requirePermission('CREATE_ROLE', request)

    const { name, description, permissions } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: name.toUpperCase() }
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      )
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase(),
        description,
        isActive: true
      }
    })

    // Add permissions to the role
    if (permissions && permissions.length > 0) {
      // First, get or create permission records
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

      // Create role-permission relationships
      await prisma.rolePermission.createMany({
        data: permissionRecords.map(permission => ({
          roleId: role.id,
          permissionId: permission.id
        }))
      })
    }

    // Fetch the created role with permissions
    const createdRole = await prisma.role.findUnique({
      where: { id: role.id },
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
      id: createdRole!.id,
      name: createdRole!.name,
      description: createdRole!.description,
      isActive: createdRole!.isActive,
      createdAt: createdRole!.createdAt,
      updatedAt: createdRole!.updatedAt,
      permissions: createdRole!.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description
      })),
      userCount: createdRole!.users.length,
      users: createdRole!.users.map((ur: any) => ur.user),
      _count: {
        users: createdRole!.users.length,
        permissions: createdRole!.permissions.length
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