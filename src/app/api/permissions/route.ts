import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/permissions - Get all permissions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
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
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

// POST /api/permissions - Create a new permission
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      )
    }

    // Check if permission already exists
    const existingPermission = await prisma.permissionModel.findFirst({
      where: { name }
    })

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission with this name already exists' },
        { status: 400 }
      )
    }

    const permission = await prisma.permissionModel.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json(permission)
  } catch (error) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    )
  }
}