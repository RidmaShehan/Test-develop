import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentPhone = searchParams.get('studentPhone')
  const callLogId = searchParams.get('callLogId')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  if (!studentPhone) {
    return new NextResponse('<Response><Hangup/></Response>', {
      headers: { 'Content-Type': 'application/xml' }
    })
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the student. Please wait.</Say>
  <Dial record="record-from-answer-dual" 
        recordingStatusCallback="${appUrl}/api/telephony/webhook/recording?callLogId=${callLogId}"
        action="${appUrl}/api/telephony/webhook/completed?callLogId=${callLogId}">
    <Number>${studentPhone}</Number>
  </Dial>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'application/xml'
    }
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
