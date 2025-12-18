import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params
    
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        levelRelation: true,
        _count: {
          select: {
            seekers: true,
          },
        },
      },
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params
    
    const body = await request.json()
    const { name, level, campus, nextIntakeDate, levelId, description, imageUrl } = body
    
    console.log('Received update request:', { id, body })
    
    // Build update data object
    const updateData: any = {
      name: name || undefined,
      level: level !== undefined ? level : undefined,
      campus: campus || undefined,
    }
    
    // Handle optional fields
    if (nextIntakeDate !== undefined) {
      updateData.nextIntakeDate = nextIntakeDate ? new Date(nextIntakeDate) : null
    }
    
    if (levelId !== undefined) {
      updateData.levelId = levelId || null
    }
    
    // Always include description and imageUrl if provided (even if null)
    if (description !== undefined) {
      updateData.description = description
    }
    
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl
    }
    
    console.log('Update data prepared:', updateData)
    
    try {
      const updatedProgram = await prisma.program.update({
        where: { id },
        data: updateData,
        include: {
          levelRelation: true,
          _count: {
            select: {
              seekers: true,
            },
          },
        },
      })

      console.log('Program updated successfully via Prisma')
      return NextResponse.json(updatedProgram)
    } catch (prismaError: any) {
      // If Prisma fails due to unknown fields, use raw SQL as fallback
      if (prismaError.message?.includes('Unknown argument') || prismaError.code === 'P2009') {
        console.warn('Prisma client cache issue detected, using raw SQL update:', prismaError.message)
        
        const setClauses: string[] = []
        const values: any[] = []
        
        if (name !== undefined) {
          setClauses.push(`name = ?`)
          values.push(name)
        }
        
        if (level !== undefined) {
          setClauses.push(`level = ?`)
          values.push(level || null)
        }
        
        if (campus !== undefined) {
          setClauses.push(`campus = ?`)
          values.push(campus)
        }
        
        if (nextIntakeDate !== undefined) {
          setClauses.push(`nextIntakeDate = ?`)
          values.push(nextIntakeDate ? new Date(nextIntakeDate).toISOString() : null)
        }
        
        if (levelId !== undefined) {
          setClauses.push(`levelId = ?`)
          values.push(levelId || null)
        }
        
        if (description !== undefined) {
          setClauses.push(`description = ?`)
          values.push(description || null)
        }
        
        if (imageUrl !== undefined) {
          setClauses.push(`imageUrl = ?`)
          values.push(imageUrl || null)
        }
        
        setClauses.push(`updatedAt = ?`)
        values.push(new Date().toISOString())
        
        values.push(id)
        
        console.log('Executing raw SQL:', `UPDATE programs SET ${setClauses.join(', ')} WHERE id = ?`)
        console.log('With values:', values)
        
        await prisma.$executeRawUnsafe(
          `UPDATE programs SET ${setClauses.join(', ')} WHERE id = ?`,
          ...values
        )
        
        // Fetch updated program
        const updatedProgram = await prisma.$queryRawUnsafe(
          `SELECT * FROM programs WHERE id = ?`,
          id
        ) as any[]
        
        if (!updatedProgram || updatedProgram.length === 0) {
          throw new Error('Program not found after update')
        }
        
        // Get the updated program with relations
        const programWithRelations = await prisma.program.findUnique({
          where: { id },
          include: {
            levelRelation: true,
            _count: {
              select: {
                seekers: true,
              },
            },
          },
        })
        
        if (!programWithRelations) {
          throw new Error('Program not found after update')
        }
        
        console.log('Program updated successfully via raw SQL')
        return NextResponse.json(programWithRelations)
      }
      throw prismaError
    }
  } catch (error) {
    console.error('Error updating program:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update program',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _user = await requireAuth(request)
    const { id } = await params
    
    // Check if program has any seekers
    const programWithSeekers = await prisma.program.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            seekers: true,
          },
        },
      },
    })

    if (!programWithSeekers) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    if ((programWithSeekers._count?.seekers || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program with existing seekers. Please reassign or remove seekers first.' },
        { status: 400 }
      )
    }
    
    await prisma.program.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}
