// Gmail API configuration
// To set up Gmail API:
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Create OAuth 2.0 credentials
// 3. Go to https://developers.google.com/oauthplayground
// 4. Configure to use your OAuth 2.0 credentials
// 5. Authorize Gmail API v1 (scope: https://www.googleapis.com/auth/gmail.send)
// 6. Exchange authorization code for refresh token
// 7. Add the refresh token to GMAIL_REFRESH_TOKEN environment variable

// Gmail API configuration - requires environment variables
// See GMAIL_SETUP_INSTRUCTIONS.md for setup guide
export const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID || '',
  clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
  redirectUri: 'https://developers.google.com/oauthplayground',
  refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
}

// Validate that required credentials are configured
if (!GMAIL_CONFIG.clientId || !GMAIL_CONFIG.clientSecret) {
  console.warn(
    '⚠️ WARNING: Gmail API credentials not configured. ' +
    'Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables. ' +
    'See GMAIL_SETUP_INSTRUCTIONS.md for setup instructions.'
  )
}

// Gmail API endpoints
export const GMAIL_API = {
  sendEmail: 'https://www.googleapis.com/gmail/v1/users/me/messages/send',
  getProfile: 'https://www.googleapis.com/gmail/v1/users/me/profile',
}

export async function getAccessToken(): Promise<string> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GMAIL_CONFIG.clientId,
        client_secret: GMAIL_CONFIG.clientSecret,
        refresh_token: GMAIL_CONFIG.refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get access token')
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw error
  }
}

export function createEmailMessage(
  to: string,
  subject: string,
  message: string,
  attachments?: Array<{ filename: string; content: string; mimeType: string }>
): string {
  const boundary = '----=_Part_0_' + Date.now()

  const email = [
    'MIME-Version: 1.0',
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    message,
  ]

  // Add attachments if any
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      email.push(
        `--${boundary}`,
        `Content-Type: ${attachment.mimeType}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content
      )
    }
  }

  email.push(`--${boundary}--`)

  // Convert to base64url
  const encodedEmail = Buffer.from(email.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return encodedEmail
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  message: string,
  attachments?: Array<{ filename: string; content: string; mimeType: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const rawEmail = createEmailMessage(to, subject, message, attachments)

    const response = await fetch(GMAIL_API.sendEmail, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: rawEmail,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error?.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

