import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { getSafeErrorMessage } from '@/lib/safe-api-error'

function canAccessPromotionCode(userId: string, userRole: string, createdById: string | null): boolean {
  return isAdminRole(userRole) || createdById === userId
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    const promotionCode = await prisma.promotionCode.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seekers: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            stage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!promotionCode) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    if (!canAccessPromotionCode(user.id, user.role, promotionCode.createdById)) {
      return NextResponse.json(
        { error: 'You do not have permission to access this promotion code' },
        { status: 403 }
      )
    }

    // Calculate actual statistics
    const totalInquiries = promotionCode.seekers.length
    const totalRegistrations = promotionCode.seekers.filter(
      (s) => s.stage === 'READY_TO_REGISTER'
    ).length
    const totalPaidLKR = promotionCode.paymentAmountLKR * totalRegistrations

    return NextResponse.json({
      ...promotionCode,
      totalInquiries,
      totalRegistrations,
      totalPaidLKR,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    const body = await request.json()
    const {
      promoterName,
      promoterAddress,
      promoterPhone,
      promoterIdNumber,
      discountAmountLKR,
      paymentAmountLKR,
      isActive,
    } = body

    // Check if promotion code exists and user can access it
    const existing = await prisma.promotionCode.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    if (!canAccessPromotionCode(user.id, user.role, existing.createdById)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this promotion code' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (promoterName !== undefined) updateData.promoterName = promoterName
    if (promoterAddress !== undefined) updateData.promoterAddress = promoterAddress
    if (promoterPhone !== undefined) updateData.promoterPhone = promoterPhone
    if (promoterIdNumber !== undefined) updateData.promoterIdNumber = promoterIdNumber
    if (discountAmountLKR !== undefined) updateData.discountAmountLKR = parseFloat(discountAmountLKR)
    if (paymentAmountLKR !== undefined) updateData.paymentAmountLKR = parseFloat(paymentAmountLKR)
    if (isActive !== undefined) updateData.isActive = isActive

    const promotionCode = await prisma.promotionCode.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(promotionCode)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    // Check if promotion code exists
    const existing = await prisma.promotionCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            seekers: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Promotion code not found' },
        { status: 404 }
      )
    }

    if (!canAccessPromotionCode(user.id, user.role, existing.createdById)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this promotion code' },
        { status: 403 }
      )
    }

    // Check if code has been used
    if (existing._count.seekers > 0) {
      return NextResponse.json(
        { error: 'Cannot delete promotion code that has been used. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.promotionCode.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Promotion code deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
