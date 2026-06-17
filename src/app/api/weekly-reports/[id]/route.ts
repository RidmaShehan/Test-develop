import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const report = await prisma.weeklyReport.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && report.createdById !== user.id) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
    }

    return NextResponse.json(report)
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

    const existing = await prisma.weeklyReport.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && existing.createdById !== user.id) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
    }

    const {
      title,
      developer,
      periodStart,
      periodEnd,
      project,
      purpose,
      activeDays,
      status,
      summary,
      metrics,
      plannedItems,
      dailyTasks,
      areasUpdated,
      risks,
      blockers,
      nextWeekPlan,
      timeAllocation,
      references,
      notes,
    } = body

    if (periodStart && periodEnd && new Date(periodEnd) < new Date(periodStart)) {
      return NextResponse.json(
        { error: 'Period end date must be after start date' },
        { status: 400 }
      )
    }

    const updated = await prisma.weeklyReport.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(developer !== undefined && { developer }),
        ...(periodStart !== undefined && { periodStart: new Date(periodStart) }),
        ...(periodEnd !== undefined && { periodEnd: new Date(periodEnd) }),
        ...(project !== undefined && { project }),
        ...(purpose !== undefined && { purpose: purpose || null }),
        ...(activeDays !== undefined && { activeDays: activeDays ? parseInt(activeDays) : null }),
        ...(status !== undefined && { status }),
        ...(summary !== undefined && { summary: summary || null }),
        ...(metrics !== undefined && { metrics }),
        ...(plannedItems !== undefined && { plannedItems }),
        ...(dailyTasks !== undefined && { dailyTasks }),
        ...(areasUpdated !== undefined && { areasUpdated }),
        ...(risks !== undefined && { risks }),
        ...(blockers !== undefined && { blockers }),
        ...(nextWeekPlan !== undefined && { nextWeekPlan }),
        ...(timeAllocation !== undefined && { timeAllocation }),
        ...(references !== undefined && { references }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(updated)
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

    const existing = await prisma.weeklyReport.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const isAdmin = isAdminRole(user.role)
    if (!isAdmin && existing.createdById !== user.id) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
    }

    await prisma.weeklyReport.delete({ where: { id } })
    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
