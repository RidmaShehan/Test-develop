import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callLogId = searchParams.get('callLogId')

    if (!callLogId) {
      return NextResponse.json({ error: 'Missing callLogId' }, { status: 400 })
    }

    const formData = await request.formData()
    const recordingUrl = formData.get('RecordingUrl')

    if (recordingUrl) {
      const callLog = await prisma.callLog.update({
        where: { id: callLogId },
        data: {
          recordingUrl: String(recordingUrl)
        }
      })

      // If there is an associated follow-up task, append the recording URL for staff reference
      if (callLog.followUpTaskId) {
        const task = await prisma.followUpTask.findUnique({
          where: { id: callLog.followUpTaskId }
        })

        if (task) {
          await prisma.followUpTask.update({
            where: { id: callLog.followUpTaskId },
            data: {
              notes: `${task.notes || ''}\nRecording URL: ${recordingUrl}`
            }
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Telephony recording webhook error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
