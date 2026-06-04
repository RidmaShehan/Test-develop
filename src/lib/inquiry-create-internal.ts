import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logUserActivity } from '@/lib/activity-logger'

/**
 * Creates one inquiry using the same persistence rules as POST /api/inquiries.
 * Used by the API route and Excel import so behaviour stays aligned.
 */
export async function createInquiryFromBody(options: {
  body: Record<string, any>
  userId: string
  request: NextRequest
}) {
  const { body, userId, request } = options

  const preferredIds: string[] = Array.isArray(body.preferredProgramIds)
    ? body.preferredProgramIds.filter(Boolean)
    : []

  const programInterestId =
    body.programInterestId ||
    (preferredIds.length > 0 ? preferredIds[0] : null)

  const seekerData: Record<string, any> = {
    fullName: body.fullName,
    phone: body.phone,
    whatsapp: body.whatsapp || false,
    whatsappNumber: body.whatsappNumber || null,
    notAnswering: body.notAnswering || false,
    email: body.email || null,
    emailNotAnswering: body.emailNotAnswering || false,
    city: body.city || null,
    ageBand: body.ageBand || null,
    guardianPhone: body.guardianPhone || null,
    programInterestId,
    marketingSource: body.marketingSource,
    campaignId: body.campaignId || null,
    preferredContactTime: body.preferredContactTime || null,
    preferredStatus: body.preferredStatus ?? null,
    followUpAgain: body.followUpAgain || false,
    followUpDate: body.followUpDate || null,
    followUpTime: body.followUpTime || null,
    description: body.description || null,
    consent: body.consent || false,
    promotionCodeId: body.promotionCodeId || null,
    createdById: userId,
    preferredPrograms: {
      create: preferredIds.map((programId: string) => ({
        programId,
      })),
    },
  }

  const seeker = await prisma.seeker.create({
    data: seekerData as any,
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
      campaigns: {
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
  })

  if (body.registerNow !== undefined) {
    try {
      await prisma.seeker.update({
        where: { id: seeker.id },
        data: { registerNow: body.registerNow || false },
      })
      ;(seeker as any).registerNow = body.registerNow || false
    } catch (updateError) {
      console.warn(
        'Could not update registerNow field (Prisma client may need regeneration):',
        updateError
      )
    }
  }

  try {
    if (
      !body.notAnswering &&
      body.callStartTime &&
      body.callDurationMinutes !== undefined &&
      body.callDurationMinutes !== null
    ) {
      const outcome = body.notAnswering ? 'NO_ANSWER' : 'CONNECTED_INTERESTED'
      await prisma.interaction.create({
        data: {
          seekerId: seeker.id,
          userId,
          channel: 'CALL',
          outcome,
          notes: `Call Start Time: ${body.callStartTime}; Call Duration: ${Number(body.callDurationMinutes)} minutes`,
        },
      })
    }
  } catch (interactionError) {
    console.error('Error creating initial call interaction:', interactionError)
  }

  if (body.campaignId && String(body.campaignId).trim() !== '') {
    try {
      await prisma.campaignSeeker.create({
        data: {
          seekerId: seeker.id,
          campaignId: body.campaignId,
        },
      })

      const updatedSeeker = await prisma.seeker.findUnique({
        where: { id: seeker.id },
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
          campaigns: {
            include: {
              campaign: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      })

      if (updatedSeeker) {
        Object.assign(seeker, updatedSeeker)
      }
    } catch (campaignError) {
      console.error('Error creating CampaignSeeker relationship:', campaignError)
    }
  }

  try {
    await logUserActivity({
      userId,
      activityType: 'CREATE_INQUIRY',
      request,
      isSuccessful: true,
      metadata: {
        seekerId: seeker.id,
        seekerName: seeker.fullName,
        seekerPhone: seeker.phone,
      },
    })
  } catch (logError) {
    console.error('Error logging inquiry creation activity:', logError)
  }

  try {
    const now = new Date()
    const firstDueDate = new Date(now)
    firstDueDate.setDate(firstDueDate.getDate() + 3)
    firstDueDate.setHours(10, 0, 0, 0)

    const secondDueDate = new Date(now)
    secondDueDate.setDate(secondDueDate.getDate() + 7)
    secondDueDate.setHours(10, 0, 0, 0)

    const firstFollowUpTask = await prisma.followUpTask.create({
      data: {
        seekerId: seeker.id,
        assignedTo: userId,
        dueAt: firstDueDate,
        purpose: 'CALLBACK',
        notes: `Automatic follow-up #1: Initial contact follow-up for inquiry - ${seeker.fullName} (${seeker.phone})`,
        status: 'OPEN',
      },
    })

    const secondFollowUpTask = await prisma.followUpTask.create({
      data: {
        seekerId: seeker.id,
        assignedTo: userId,
        dueAt: secondDueDate,
        purpose: 'CALLBACK',
        notes: `Automatic follow-up #2: Secondary follow-up for inquiry - ${seeker.fullName} (${seeker.phone})`,
        status: 'OPEN',
      },
    })

    await Promise.all([
      prisma.taskActionHistory.create({
        data: {
          taskId: firstFollowUpTask.id,
          fromStatus: null,
          toStatus: 'OPEN',
          actionBy: userId,
          notes: 'Task created automatically from new inquiry - First follow-up (3 days)',
        },
      }),
      prisma.taskActionHistory.create({
        data: {
          taskId: secondFollowUpTask.id,
          fromStatus: null,
          toStatus: 'OPEN',
          actionBy: userId,
          notes: 'Task created automatically from new inquiry - Second follow-up (7 days)',
        },
      }),
    ])
  } catch (taskError) {
    console.error('Error creating automatic follow-up tasks:', taskError)
  }

  return seeker
}
