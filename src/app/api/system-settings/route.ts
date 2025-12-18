import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only ADMIN/ADMINISTRATOR/DEVELOPER can view system settings
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only ADMIN/ADMINISTRATOR/DEVELOPER can update system settings
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { key, value, description } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedBy: user.id,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        description,
        updatedBy: user.id
      }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating system setting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
