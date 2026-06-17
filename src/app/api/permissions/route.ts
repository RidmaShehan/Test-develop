import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { Permission } from '@prisma/client'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { AuthenticationError } from '@/lib/auth'
import { logPermissionCreation } from '@/lib/activity-logger'

const VALID_PERMISSION_NAMES = new Set(Object.values(Permission))

// GET /api/permissions - Get all permissions (requires READ_ROLE or MANAGE_ROLE_PERMISSIONS)
export async function GET(request: NextRequest) {
  try {
    await requirePermission(['READ_ROLE', 'MANAGE_ROLE_PERMISSIONS'], request, { any: true })

    const permissions = await prisma.permissionModel.findMany({
      include: {
        _count: {
          select: {
            roles: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(permissions)
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

// POST /api/permissions - Create a new permission (requires MANAGE_ROLE_PERMISSIONS; name must be in Permission enum)
export async function POST(request: NextRequest) {
  try {
    const _user = await requirePermission('MANAGE_ROLE_PERMISSIONS', request)

    const { name, description } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      )
    }

    if (!VALID_PERMISSION_NAMES.has(name as Permission)) {
      return NextResponse.json(
        { error: 'Permission name must be a valid system permission' },
        { status: 400 }
      )
    }

    const existingPermission = await prisma.permissionModel.findFirst({
      where: { name: name as Permission }
    })

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission with this name already exists' },
        { status: 400 }
      )
    }

    const permission = await prisma.permissionModel.create({
      data: {
        name: name as Permission,
        description: description ?? undefined,
      },
    })

    logPermissionCreation(_user.id, request, {
      permissionName: name,
      description: description ?? undefined,
    }).catch(() => {})

    return NextResponse.json(permission)
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