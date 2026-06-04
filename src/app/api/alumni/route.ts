import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { AuthenticationError } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requirePermission('READ_ALUMNI', req)

    const status = req.nextUrl.searchParams.get('status')
    const programId = req.nextUrl.searchParams.get('programId')
    const search = req.nextUrl.searchParams.get('search') || ''

    const alumni = await prisma.alumni.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(programId && { programId }),
        ...(search && {
          seeker: { fullName: { contains: search, mode: 'insensitive' } },
        }),
      },
      include: {
        seeker: { select: { id: true, fullName: true, email: true, phone: true } },
        program: { select: { id: true, name: true, campus: true } },
        _count: { select: { engagements: true } },
      },
      orderBy: { graduatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: alumni })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('MANAGE_ALUMNI', req)
    const body = await req.json()
    const { seekerId, graduatedAt, programId, currentRole, employer, status, linkedinUrl, testimonial, isPublic } = body

    if (!seekerId || !graduatedAt) {
      return NextResponse.json({ error: 'seekerId and graduatedAt are required' }, { status: 400 })
    }

    const seeker = await prisma.seeker.findUnique({ where: { id: seekerId } })
    if (!seeker) return NextResponse.json({ error: 'Seeker not found' }, { status: 404 })

    const alumni = await prisma.alumni.create({
      data: {
        seekerId,
        graduatedAt: new Date(graduatedAt),
        programId,
        currentRole,
        employer,
        status: (status as any) || 'UNKNOWN',
        linkedinUrl,
        testimonial,
        isPublic: isPublic ?? false,
      },
      include: {
        seeker: { select: { id: true, fullName: true, email: true } },
        program: { select: { id: true, name: true, campus: true } },
      },
    })

    return NextResponse.json({ success: true, data: alumni }, { status: 201 })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    if (err.code === 'P2002') return NextResponse.json({ error: 'This seeker is already an alumnus' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create alumni record' }, { status: 500 })
  }
}
