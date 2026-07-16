import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/handle-api-error'

export async function GET(request: NextRequest) {
  try {
    const manager = await requireAuth(request)

    const globalAdmin = ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER', 'SYSTEM'].includes(manager.role)
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const projectId = searchParams.get('projectId')
    const targetUserId = searchParams.get('userId')
    const taskStatus = searchParams.get('status')

    // Determine access controls: Only managers/admins can view other workloads
    const isManagerOrAdmin = globalAdmin || manager.role === 'COORDINATOR'
    const activeUserId = isManagerOrAdmin ? (targetUserId || undefined) : manager.id

    const users = await prisma.user.findMany({
      where: {
        ...(activeUserId ? { id: activeUserId } : {}),
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    const workloadData = []
    const now = new Date()

    for (const employee of users) {
      // 1. Compile Task filters
      const taskWhere: any = {
        assignedToId: employee.id,
        ...(projectId ? { projectId } : {}),
        ...(taskStatus ? { status: taskStatus } : {})
      }

      if (startDateParam || endDateParam) {
        taskWhere.createdAt = {}
        if (startDateParam) taskWhere.createdAt.gte = new Date(startDateParam)
        if (endDateParam) taskWhere.createdAt.lte = new Date(endDateParam)
      }

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        select: { id: true, status: true, dueDate: true }
      })

      const assignedTasksCount = tasks.length
      const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length
      const overdueTasksCount = tasks.filter(
        t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now
      ).length
      const completionRate = assignedTasksCount > 0 ? Math.round((completedTasksCount / assignedTasksCount) * 100) : 0

      // 2. Logged Hours calculations
      const timeWhere: any = { userId: employee.id }
      if (startDateParam || endDateParam) {
        timeWhere.startTime = {}
        if (startDateParam) timeWhere.startTime.gte = new Date(startDateParam)
        if (endDateParam) timeWhere.startTime.lte = new Date(endDateParam)
      }

      const timeEntries = await prisma.taskTimeEntry.findMany({
        where: timeWhere,
        select: { duration: true }
      })

      const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const loggedHours = Math.round((totalMinutes / 60) * 10) / 10

      // 3. Seeker Interactions log statistics
      const interactionWhere: any = { userId: employee.id }
      if (startDateParam || endDateParam) {
        interactionWhere.createdAt = {}
        if (startDateParam) interactionWhere.createdAt.gte = new Date(startDateParam)
        if (endDateParam) interactionWhere.createdAt.lte = new Date(endDateParam)
      }

      const interactions = await prisma.interaction.findMany({
        where: interactionWhere,
        select: { channel: true }
      })

      const interactionStats = {
        phone: interactions.filter(i => i.channel === 'CALL').length,
        email: interactions.filter(i => i.channel === 'EMAIL').length,
        whatsapp: interactions.filter(i => i.channel === 'WHATSAPP').length,
        total: interactions.length
      }

      // 4. Calculate Average Email Response Time (minutes)
      const userThreads = await prisma.emailThread.findMany({
        where: { emailAccount: { userId: employee.id } },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' }
          }
        }
      })

      let totalEmailDiff = 0
      let emailMatchCount = 0

      for (const thread of userThreads) {
        const msgs = thread.messages
        for (let i = 0; i < msgs.length - 1; i++) {
          if (msgs[i].direction === 'INBOUND' && msgs[i+1].direction === 'OUTBOUND') {
            const diffMs = new Date(msgs[i+1].sentAt).getTime() - new Date(msgs[i].sentAt).getTime()
            if (diffMs > 0) {
              totalEmailDiff += diffMs / (60 * 1000)
              emailMatchCount++
            }
          }
        }
      }

      const emailResponseTime = emailMatchCount > 0 ? Math.round(totalEmailDiff / emailMatchCount) : 0

      // 5. Calculate Average WhatsApp Response Time (minutes)
      const outboundWhatsApp = await prisma.whatsAppInboxMessage.findMany({
        where: {
          sentById: employee.id,
          direction: 'outbound'
        },
        orderBy: { receivedAt: 'asc' }
      })

      let totalWaDiff = 0
      let waMatchCount = 0

      for (const outMsg of outboundWhatsApp) {
        if (!outMsg.seekerId) continue

        const inboundMsg = await prisma.whatsAppInboxMessage.findFirst({
          where: {
            seekerId: outMsg.seekerId,
            direction: 'inbound',
            receivedAt: { lt: outMsg.receivedAt }
          },
          orderBy: { receivedAt: 'desc' }
        })

        if (inboundMsg) {
          const diffMs = new Date(outMsg.receivedAt).getTime() - new Date(inboundMsg.receivedAt).getTime()
          if (diffMs > 0) {
            totalWaDiff += diffMs / (60 * 1000)
            waMatchCount++
          }
        }
      }

      const whatsappResponseTime = waMatchCount > 0 ? Math.round(totalWaDiff / waMatchCount) : 0

      workloadData.push({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeRole: employee.role,
        assignedTasksCount,
        completedTasksCount,
        overdueTasksCount,
        completionRate,
        loggedHours,
        studentInteractions: interactionStats,
        emailResponseTime,
        whatsappResponseTime
      })
    }

    return NextResponse.json(workloadData)
  } catch (error) {
    return handleApiError(error)
  }
}
