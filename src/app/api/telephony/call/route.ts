import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { seekerId, agentPhone } = body

    if (!seekerId || !agentPhone) {
      return NextResponse.json({ error: 'Missing seekerId or agentPhone' }, { status: 400 })
    }

    const seeker = await prisma.seeker.findUnique({
      where: { id: seekerId }
    })

    if (!seeker) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    if (!accountSid || !authToken || !twilioNumber) {
      return NextResponse.json(
        { error: 'Twilio Voice credentials are not configured.' },
        { status: 503 }
      )
    }

    // 1. Create CallLog entry
    const callLog = await prisma.callLog.create({
      data: {
        seekerId,
        userId: user.id,
        direction: 'OUTBOUND',
        status: 'initiated',
        duration: 0,
      }
    })

    // 2. Build TwiML webhook URL
    const twimlUrl = `${appUrl}/api/telephony/twiml?studentPhone=${encodeURIComponent(seeker.phone)}&callLogId=${callLog.id}`

    // 3. Trigger Call to Agent
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          From: twilioNumber,
          To: agentPhone,
          Url: twimlUrl,
          StatusCallback: `${appUrl}/api/telephony/webhook/completed?callLogId=${callLog.id}`,
          StatusCallbackEvent: 'completed',
        }),
      }
    )

    if (!twilioRes.ok) {
      const errText = await twilioRes.text()
      console.error('Twilio initiation failed:', errText)
      return NextResponse.json({ error: 'Failed to place call via Twilio.' }, { status: 502 })
    }

    const twilioData = await twilioRes.json()

    // 4. Record Call SID
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: { callSid: twilioData.sid }
    })

    // Log user activity
    const { logUserActivity } = await import('@/lib/audit')
    await logUserActivity({
      userId: user.id,
      activityType: 'PHONE_CALL',
      metadata: { seekerId, callLogId: callLog.id, direction: 'OUTBOUND' }
    })

    return NextResponse.json({ success: true, callLogId: callLog.id })
  } catch (error) {
    return handleApiError(error)
  }
}
