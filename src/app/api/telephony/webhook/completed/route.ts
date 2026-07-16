import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callLogId = searchParams.get('callLogId')

    if (!callLogId) {
      return NextResponse.json({ error: 'Missing callLogId' }, { status: 400 })
    }

    const callLog = await prisma.callLog.findUnique({
      where: { id: callLogId }
    })

    if (!callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 })
    }

    // Twilio sends form url-encoded bodies
    const formData = await request.formData()
    const rawDuration = formData.get('DialCallDuration') || formData.get('CallDuration') || '0'
    const twilioStatus = formData.get('DialCallStatus') || formData.get('CallStatus') || 'failed'

    const duration = parseInt(String(rawDuration), 10) || 0
    const status = String(twilioStatus).toLowerCase()

    // 1. Update CallLog
    const updatedCallLog = await prisma.callLog.update({
      where: { id: callLogId },
      data: {
        duration,
        status,
      }
    })

    // 2. Create student interaction log
    const interactionOutcome = status === 'completed' ? 'CONNECTED_INTERESTED' : 'NO_ANSWER'
    await prisma.interaction.create({
      data: {
        seekerId: callLog.seekerId,
        userId: callLog.userId,
        channel: 'CALL',
        outcome: interactionOutcome,
        notes: `Call finished. Duration: ${duration} seconds. Twilio status: ${status}.`
      }
    })

    // 3. Create follow-up task automatically
    const isCompleted = status === 'completed'
    const followUpTask = await prisma.followUpTask.create({
      data: {
        seekerId: callLog.seekerId,
        assignedTo: callLog.userId,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        purpose: 'CALLBACK',
        status: 'OPEN',
        notes: `Auto-generated follow-up task from call log. Status was ${status}. ${
          isCompleted ? 'Follow up with next steps.' : 'Retry connecting with the student.'
        }`
      }
    })

    // 4. Link follow-up task to call log
    await prisma.callLog.update({
      where: { id: callLogId },
      data: {
        followUpTaskId: followUpTask.id
      }
    })

    // TwiML response to wrap up call if needed
    return new NextResponse('<Response><Hangup/></Response>', {
      headers: { 'Content-Type': 'application/xml' }
    })
  } catch (error) {
    console.error('Telephony completed webhook error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

// Fallback GET
export async function GET(request: NextRequest) {
  return POST(request)
}
