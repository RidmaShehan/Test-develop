// SMS sending utility — supports Notify.lk and Twilio

interface SMSOptions {
  to: string // phone number with country code, e.g. "+94771234567"
  message: string
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

async function sendViaNotifyLk(to: string, message: string): Promise<SMSResult> {
  const userId = process.env.NOTIFY_LK_USER_ID
  const apiKey = process.env.NOTIFY_LK_API_KEY
  const senderId = process.env.NOTIFY_LK_SENDER_ID || 'EduCRM'

  if (!userId || !apiKey) {
    throw new Error('Notify.lk credentials not configured')
  }

  const params = new URLSearchParams({
    user_id: userId,
    api_key: apiKey,
    sender_id: senderId,
    to: to.replace(/^\+/, '').replace(/^0/, '94'), // normalize to 94XXXXXXXXX
    message,
  })

  const response = await fetch(`https://app.notify.lk/api/v1/send?${params}`, { method: 'POST' })
  const data = await response.json()

  if (data.status === 'success') {
    return { success: true, messageId: String(data.data?.id) }
  }
  return { success: false, error: data.message || 'SMS send failed' }
}

async function sendViaTwilio(to: string, message: string): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured')
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const body = new URLSearchParams({ From: fromNumber, To: to, Body: message })

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  )

  const data = await response.json()
  if (data.sid) {
    return { success: true, messageId: data.sid }
  }
  return { success: false, error: data.message || 'Twilio SMS failed' }
}

export async function sendSMS({ to, message }: SMSOptions): Promise<SMSResult> {
  const provider = process.env.SMS_PROVIDER || 'notify_lk'

  try {
    if (provider === 'twilio') {
      return await sendViaTwilio(to, message)
    }
    return await sendViaNotifyLk(to, message)
  } catch (err: any) {
    console.error(`SMS send error [${provider}]:`, err)
    return { success: false, error: err.message }
  }
}

export async function sendBulkSMS(
  recipients: { phone: string; name?: string }[],
  messageTemplate: string
): Promise<{ sent: number; failed: number; results: SMSResult[] }> {
  let sent = 0
  let failed = 0
  const results: SMSResult[] = []

  for (const recipient of recipients) {
    const message = messageTemplate.replace(/{{name}}/gi, recipient.name || 'Student')
    const result = await sendSMS({ to: recipient.phone, message })
    results.push(result)
    if (result.success) sent++
    else failed++
    // Rate limiting: 100ms delay between sends
    await new Promise((r) => setTimeout(r, 100))
  }

  return { sent, failed, results }
}
