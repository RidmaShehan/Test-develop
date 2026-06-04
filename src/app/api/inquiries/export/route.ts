import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel' // excel or csv

    // Build where clause based on user role
    const where: any = {
      NOT: { isDeleted: true },
    }
    
    if (!(await canViewAllInquiries(user.id, user.role))) {
      where.createdById = user.id
    }

    // Fetch all inquiries with all related data
    const inquiries = await prisma.seeker.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        programInterest: {
          select: {
            id: true,
            name: true,
            level: true,
            campus: true,
          },
        },
        preferredPrograms: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                level: true,
                campus: true,
              },
            },
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
        interactions: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        followUpTasks: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            actionHistory: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                actionAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fetch activity logs related to inquiries
    const inquiryIds = inquiries.map(inq => inq.id)
    const allActivityLogs = await prisma.userActivityLog.findMany({
      where: {
        activityType: {
          in: ['CREATE_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY'],
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Filter activity logs by seeker ID from metadata
    const activityLogsBySeeker = new Map<string, typeof allActivityLogs>()
    allActivityLogs.forEach(log => {
      const metadata = log.metadata as any
      const seekerId = metadata?.seekerId
      if (seekerId && inquiryIds.includes(seekerId)) {
        if (!activityLogsBySeeker.has(seekerId)) {
          activityLogsBySeeker.set(seekerId, [])
        }
        activityLogsBySeeker.get(seekerId)!.push(log)
      }
    })

    if (format === 'csv') {
      return exportToCSV(inquiries, activityLogsBySeeker)
    } else {
      return exportToExcel(inquiries, activityLogsBySeeker)
    }
  } catch (error) {
    console.error('Error exporting inquiries:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to export inquiries' },
      { status: 500 }
    )
  }
}

function exportToCSV(
  inquiries: any[],
  activityLogsBySeeker: Map<string, any[]>
) {
  // Create main inquiries CSV
  const inquiriesRows = [
    [
      'ID',
      'Full Name',
      'Phone',
      'Email',
      'WhatsApp',
      'WhatsApp Number',
      'City',
      'Age Band',
      'Guardian Phone',
      'Marketing Source',
      'Campaign',
      'Stage',
      'Program Interest',
      'Preferred Programs',
      'Preferred Contact Time',
      'Preferred Status',
      'Follow Up Again',
      'Follow Up Date',
      'Follow Up Time',
      'Description',
      'Consent',
      'Register Now',
      'Created By',
      'Created By Email',
      'Created At',
      'Updated At',
      'Total Interactions',
      'Total Tasks',
      'Total Task Changes',
      'Total Activity Logs',
    ],
  ]

  inquiries.forEach(inquiry => {
    const preferredPrograms = inquiry.preferredPrograms
      .map((pp: any) => `${pp.program.name} (${pp.program.level})`)
      .join('; ')
    
    const campaigns = inquiry.campaigns
      .map((cs: any) => cs.campaign.name)
      .join('; ')

    const activityLogs = activityLogsBySeeker.get(inquiry.id) || []
    const taskChanges = inquiry.followUpTasks.reduce(
      (sum: number, task: any) => sum + task.actionHistory.length,
      0
    )

    inquiriesRows.push([
      inquiry.id,
      inquiry.fullName || '',
      inquiry.phone || '',
      inquiry.email || '',
      inquiry.whatsapp ? 'Yes' : 'No',
      inquiry.whatsappNumber || '',
      inquiry.city || '',
      inquiry.ageBand || '',
      inquiry.guardianPhone || '',
      inquiry.marketingSource || '',
      campaigns || '',
      inquiry.stage || '',
      inquiry.programInterest ? `${inquiry.programInterest.name} (${inquiry.programInterest.level})` : '',
      preferredPrograms || '',
      inquiry.preferredContactTime || '',
      inquiry.preferredStatus?.toString() || '',
      inquiry.followUpAgain ? 'Yes' : 'No',
      inquiry.followUpDate || '',
      inquiry.followUpTime || '',
      (inquiry.description || '').replace(/\n/g, ' ').replace(/"/g, '""'),
      inquiry.consent ? 'Yes' : 'No',
      inquiry.registerNow ? 'Yes' : 'No',
      inquiry.createdBy?.name || '',
      inquiry.createdBy?.email || '',
      new Date(inquiry.createdAt).toISOString(),
      inquiry.updatedAt ? new Date(inquiry.updatedAt).toISOString() : '',
      inquiry.interactions.length.toString(),
      inquiry.followUpTasks.length.toString(),
      taskChanges.toString(),
      activityLogs.length.toString(),
    ])
  })

  // Create detailed CSV with all related data
  const csvContent = inquiriesRows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inquiries-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

function exportToExcel(
  inquiries: any[],
  activityLogsBySeeker: Map<string, any[]>
) {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Main Inquiries Data
  const inquiriesData = [
    [
      'ID',
      'Full Name',
      'Phone',
      'Email',
      'WhatsApp',
      'WhatsApp Number',
      'City',
      'Age Band',
      'Guardian Phone',
      'Marketing Source',
      'Campaign',
      'Stage',
      'Program Interest',
      'Preferred Programs',
      'Preferred Contact Time',
      'Preferred Status',
      'Follow Up Again',
      'Follow Up Date',
      'Follow Up Time',
      'Description',
      'Consent',
      'Register Now',
      'Created By',
      'Created By Email',
      'Created At',
      'Updated At',
      'Total Interactions',
      'Total Tasks',
      'Total Task Changes',
      'Total Activity Logs',
    ],
  ]

  inquiries.forEach(inquiry => {
    const preferredPrograms = inquiry.preferredPrograms
      .map((pp: any) => `${pp.program.name} (${pp.program.level})`)
      .join('; ')
    
    const campaigns = inquiry.campaigns
      .map((cs: any) => cs.campaign.name)
      .join('; ')

    const activityLogs = activityLogsBySeeker.get(inquiry.id) || []
    const taskChanges = inquiry.followUpTasks.reduce(
      (sum: number, task: any) => sum + task.actionHistory.length,
      0
    )

    inquiriesData.push([
      inquiry.id,
      inquiry.fullName || '',
      inquiry.phone || '',
      inquiry.email || '',
      inquiry.whatsapp ? 'Yes' : 'No',
      inquiry.whatsappNumber || '',
      inquiry.city || '',
      inquiry.ageBand || '',
      inquiry.guardianPhone || '',
      inquiry.marketingSource || '',
      campaigns || '',
      inquiry.stage || '',
      inquiry.programInterest ? `${inquiry.programInterest.name} (${inquiry.programInterest.level})` : '',
      preferredPrograms || '',
      inquiry.preferredContactTime || '',
      inquiry.preferredStatus?.toString() || '',
      inquiry.followUpAgain ? 'Yes' : 'No',
      inquiry.followUpDate || '',
      inquiry.followUpTime || '',
      inquiry.description || '',
      inquiry.consent ? 'Yes' : 'No',
      inquiry.registerNow ? 'Yes' : 'No',
      inquiry.createdBy?.name || '',
      inquiry.createdBy?.email || '',
      new Date(inquiry.createdAt).toISOString(),
      inquiry.updatedAt ? new Date(inquiry.updatedAt).toISOString() : '',
      inquiry.interactions.length,
      inquiry.followUpTasks.length,
      taskChanges,
      activityLogs.length,
    ])
  })

  const inquiriesSheet = XLSX.utils.aoa_to_sheet(inquiriesData)
  XLSX.utils.book_append_sheet(workbook, inquiriesSheet, 'Inquiries')

  // Sheet 2: Interactions
  const interactionsData = [
    [
      'Inquiry ID',
      'Inquiry Name',
      'Inquiry Phone',
      'Interaction ID',
      'Channel',
      'Outcome',
      'Notes',
      'User',
      'User Email',
      'Created At',
    ],
  ]

  inquiries.forEach(inquiry => {
    inquiry.interactions.forEach((interaction: any) => {
      interactionsData.push([
        inquiry.id,
        inquiry.fullName,
        inquiry.phone,
        interaction.id,
        interaction.channel,
        interaction.outcome,
        interaction.notes || '',
        interaction.user?.name || '',
        interaction.user?.email || '',
        new Date(interaction.createdAt).toISOString(),
      ])
    })
  })

  const interactionsSheet = XLSX.utils.aoa_to_sheet(interactionsData)
  XLSX.utils.book_append_sheet(workbook, interactionsSheet, 'Interactions')

  // Sheet 3: Tasks
  const tasksData = [
    [
      'Inquiry ID',
      'Inquiry Name',
      'Inquiry Phone',
      'Task ID',
      'Purpose',
      'Status',
      'Notes',
      'Due Date',
      'Assigned To',
      'Assigned To Email',
      'Created At',
      'Updated At',
    ],
  ]

  inquiries.forEach(inquiry => {
    inquiry.followUpTasks.forEach((task: any) => {
      tasksData.push([
        inquiry.id,
        inquiry.fullName,
        inquiry.phone,
        task.id,
        task.purpose || '',
        task.status,
        task.notes || '',
        task.dueAt ? new Date(task.dueAt).toISOString() : '',
        task.user?.name || '',
        task.user?.email || '',
        new Date(task.createdAt).toISOString(),
        task.updatedAt ? new Date(task.updatedAt).toISOString() : '',
      ])
    })
  })

  const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData)
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks')

  // Sheet 4: Task Changes (Action History)
  const taskChangesData = [
    [
      'Inquiry ID',
      'Inquiry Name',
      'Inquiry Phone',
      'Task ID',
      'Change ID',
      'From Status',
      'To Status',
      'Changed By',
      'Changed By Email',
      'Notes',
      'Changed At',
    ],
  ]

  inquiries.forEach(inquiry => {
    inquiry.followUpTasks.forEach((task: any) => {
      task.actionHistory.forEach((history: any) => {
        taskChangesData.push([
          inquiry.id,
          inquiry.fullName,
          inquiry.phone,
          task.id,
          history.id,
          history.fromStatus || '',
          history.toStatus,
          history.user?.name || '',
          history.user?.email || '',
          history.notes || '',
          new Date(history.actionAt).toISOString(),
        ])
      })
    })
  })

  const taskChangesSheet = XLSX.utils.aoa_to_sheet(taskChangesData)
  XLSX.utils.book_append_sheet(workbook, taskChangesSheet, 'Task Changes')

  // Sheet 5: Activity Logs
  const activityLogsData = [
    [
      'Inquiry ID',
      'Inquiry Name',
      'Inquiry Phone',
      'Activity ID',
      'Activity Type',
      'User',
      'User Email',
      'User Role',
      'Timestamp',
      'IP Address',
      'Status',
      'Failure Reason',
    ],
  ]

  inquiries.forEach(inquiry => {
    const activityLogs = activityLogsBySeeker.get(inquiry.id) || []
    activityLogs.forEach((log: any) => {
      activityLogsData.push([
        inquiry.id,
        inquiry.fullName,
        inquiry.phone,
        log.id,
        log.activityType,
        log.user?.name || '',
        log.user?.email || '',
        log.user?.role || '',
        new Date(log.timestamp).toISOString(),
        log.ipAddress || '',
        log.isSuccessful ? 'Success' : 'Failed',
        log.failureReason || '',
      ])
    })
  })

  const activityLogsSheet = XLSX.utils.aoa_to_sheet(activityLogsData)
  XLSX.utils.book_append_sheet(workbook, activityLogsSheet, 'Activity Logs')

  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="inquiries-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}

