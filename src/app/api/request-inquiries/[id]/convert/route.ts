import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'

// POST /api/request-inquiries/[id]/convert - Convert exhibition visitor to regular inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Get the exhibition visitor with all related data
    const visitor = await requestInquiryPrisma.exhibitionVisitor.findUnique({
      where: { id },
      include: {
        programs: {
          include: {
            program: true,
          },
        },
        metadata: true,
      },
    })

    if (!visitor) {
      return NextResponse.json(
        { error: 'Request inquiry not found' },
        { status: 404 }
      )
    }

    // Check if already converted
    if (visitor.isConverted) {
      return NextResponse.json(
        { error: 'This exhibition visitor has already been converted to an inquiry' },
        { status: 400 }
      )
    }

    // Check for duplicate phone number in main database
    const existingSeeker = await prisma.seeker.findUnique({
      where: {
        phone: visitor.workPhone,
      },
    })

    if (existingSeeker) {
      return NextResponse.json(
        { error: 'An inquiry with this phone number already exists' },
        { status: 400 }
      )
    }

    // Map selected programs to preferred programs in main database
    const preferredProgramIds: string[] = []
    if (visitor.programs && visitor.programs.length > 0) {
      // Try to find matching programs in main database by name
      for (const vp of visitor.programs) {
        const mainProgram = await prisma.program.findFirst({
          where: {
            name: {
              contains: vp.program.programName,
              mode: 'insensitive',
            },
          },
        })
        if (mainProgram) {
          preferredProgramIds.push(mainProgram.id)
        }
      }
    }

    // Create the inquiry in the main database using the same process as POST /api/inquiries
    const seekerData: any = {
      fullName: visitor.name,
      phone: visitor.workPhone,
      whatsapp: false,
      whatsappNumber: null,
      notAnswering: false,
      email: null,
      emailNotAnswering: false,
      city: visitor.metadata?.city || null,
      ageBand: null,
      guardianPhone: null,
      marketingSource: 'EXHIBITION',
      campaignId: null,
      preferredContactTime: null,
      preferredStatus: null,
      followUpAgain: false,
      followUpDate: null,
      followUpTime: null,
      description: visitor.metadata ? 
        `Exhibition Registration - ${visitor.metadata.country || 'Unknown'} - ${visitor.metadata.browser || 'Unknown Browser'}` : 
        'Exhibition Registration',
      consent: true,
      createdById: user.id,
      preferredPrograms: preferredProgramIds.length > 0 ? {
        create: preferredProgramIds.map((programId: string) => ({
          programId: programId,
        })),
      } : undefined,
    }

    const seeker = await prisma.seeker.create({
      data: seekerData,
      include: {
        programInterest: true,
        preferredPrograms: {
          include: {
            program: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    })

    // Assign the coordinator to the seeker if defined
    if (visitor.coordinatorId) {
      try {
        await prisma.assignment.create({
          data: {
            seekerId: seeker.id,
            coordinatorId: visitor.coordinatorId,
          },
        })
      } catch (assignError) {
        console.error('Error assigning coordinator to seeker:', assignError)
      }
    }

    // Create automatic follow-up tasks if not registering now
    try {
      const firstDueDate = new Date()
      firstDueDate.setDate(firstDueDate.getDate() + 3)

      const secondDueDate = new Date()
      secondDueDate.setDate(secondDueDate.getDate() + 7)

      const taskAssigneeId = visitor.coordinatorId || user.id

      const [firstFollowUpTask, secondFollowUpTask] = await Promise.all([
        prisma.followUpTask.create({
          data: {
            seekerId: seeker.id,
            assignedTo: taskAssigneeId,
            dueAt: firstDueDate,
            purpose: 'CALLBACK',
            notes: `Automatic follow-up #1: Primary follow-up for exhibition inquiry - ${seeker.fullName} (${seeker.phone})`,
            status: 'OPEN',
          },
        }),
        prisma.followUpTask.create({
          data: {
            seekerId: seeker.id,
            assignedTo: taskAssigneeId,
            dueAt: secondDueDate,
            purpose: 'CALLBACK',
            notes: `Automatic follow-up #2: Secondary follow-up for exhibition inquiry - ${seeker.fullName} (${seeker.phone})`,
            status: 'OPEN',
          },
        }),
      ])

      await Promise.all([
        prisma.taskActionHistory.create({
          data: {
            taskId: firstFollowUpTask.id,
            fromStatus: null,
            toStatus: 'OPEN',
            actionBy: user.id,
            notes: 'Task created automatically from exhibition registration - First follow-up (3 days)',
          },
        }),
        prisma.taskActionHistory.create({
          data: {
            taskId: secondFollowUpTask.id,
            fromStatus: null,
            toStatus: 'OPEN',
            actionBy: user.id,
            notes: 'Task created automatically from exhibition registration - Second follow-up (7 days)',
          },
        }),
      ])
    } catch (taskError) {
      console.error('Error creating automatic follow-up tasks:', taskError)
    }

    // Mark visitor as converted in the database
    const updatedVisitor = await requestInquiryPrisma.exhibitionVisitor.update({
      where: { id },
      data: {
        isConverted: true,
        convertedAt: new Date(),
      },
      include: {
        programs: {
          include: {
            program: true,
          },
        },
        metadata: true,
      },
    })

    return NextResponse.json({
      success: true,
      inquiry: seeker,
      visitor: updatedVisitor,
    })
  } catch (error) {
    console.error('Error converting request inquiry:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to convert request inquiry' },
      { status: 500 }
    )
  }
}
