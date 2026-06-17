import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: any = { createdById: user.id }
    if (status && status !== 'ALL') where.status = status

    const [reports, total] = await prisma.$transaction([
      prisma.weeklyReport.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { periodStart: 'desc' },
        skip,
        take: limit,
      }),
      prisma.weeklyReport.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

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

    if (!title || !periodStart || !periodEnd || !project) {
      return NextResponse.json(
        { error: 'Title, period start, period end, and project are required' },
        { status: 400 }
      )
    }

    if (new Date(periodEnd) < new Date(periodStart)) {
      return NextResponse.json(
        { error: 'Period end date must be after start date' },
        { status: 400 }
      )
    }

    const report = await prisma.weeklyReport.create({
      data: {
        title,
        developer: developer || user.name,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        project,
        purpose: purpose || null,
        activeDays: activeDays ? parseInt(activeDays) : null,
        status: status || 'DRAFT',
        summary: summary || null,
        metrics: metrics || [],
        plannedItems: plannedItems || [],
        dailyTasks: dailyTasks || [],
        areasUpdated: areasUpdated || [],
        risks: risks || [],
        blockers: blockers || [],
        nextWeekPlan: nextWeekPlan || [],
        timeAllocation: timeAllocation || [],
        references: references || [],
        notes: notes || null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
