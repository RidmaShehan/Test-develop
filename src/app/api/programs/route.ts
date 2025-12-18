import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/programs - Get all programs
// Accessible to all authenticated users regardless of role
export async function GET(request: NextRequest) {
  try {
    // Require authentication but allow any role
    const _user = await requireAuth(request)
    
    const programs = await prisma.program.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        levelRelation: true,
        _count: {
          select: {
            seekers: true,
            preferredBy: true,
          }
        }
      }
    })

    return NextResponse.json(programs)
  } catch (error) {
    console.error('❌ ERROR in /api/programs:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return proper JSON error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch programs',
        details: error instanceof Error ? error.message : 'Unknown error',
        route: '/api/programs'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    
    const body = await request.json()
    
    const program = await prisma.program.create({
      data: body,
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}