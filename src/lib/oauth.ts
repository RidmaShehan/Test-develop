import { prisma } from '@/lib/prisma'

// Configuration loaders
export function getGoogleConfig() {
  return {
    clientId: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/callback?provider=google',
  }
}

export function getMicrosoftConfig() {
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/callback?provider=microsoft',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
  }
}

// ─── GOOGLE GMAIL OAUTH FLOW ──────────────────────────────────────────

export function getGoogleAuthUrl(): string {
  const { clientId, redirectUri } = getGoogleConfig()
  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
  ]
  
  return `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  }).toString()
}

export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  email: string
}> {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig()
  
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text()
    throw new Error(`Failed to exchange Google OAuth code: ${errorText}`)
  }

  const tokenData = await tokenRes.json()
  
  // Fetch user's email address
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!profileRes.ok) {
    throw new Error('Failed to fetch Google user profile')
  }

  const profileData = await profileRes.json()

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || '', // Sometimes refresh token is only sent on first prompt consent
    expiresIn: tokenData.expires_in,
    email: profileData.email,
  }
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string
  expiresIn: number
}> {
  const { clientId, clientSecret } = getGoogleConfig()

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to refresh Google token: ${text}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

// ─── MICROSOFT GRAPH OAUTH FLOW ─────────────────────────────────────

export function getMicrosoftAuthUrl(): string {
  const { clientId, redirectUri, tenantId } = getMicrosoftConfig()
  const scopes = [
    'offline_access',
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/User.Read',
  ]

  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    response_mode: 'query',
  }).toString()
}

export async function exchangeMicrosoftCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
  email: string
}> {
  const { clientId, clientSecret, redirectUri, tenantId } = getMicrosoftConfig()

  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text()
    throw new Error(`Failed to exchange Microsoft OAuth code: ${errorText}`)
  }

  const tokenData = await tokenRes.json()

  // Fetch Microsoft user profile to get email
  const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!profileRes.ok) {
    throw new Error('Failed to fetch Microsoft profile info')
  }

  const profileData = await profileRes.json()
  const email = profileData.mail || profileData.userPrincipalName

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    email,
  }
}

export async function refreshMicrosoftToken(refreshToken: string): Promise<{
  accessToken: string
  expiresIn: number
}> {
  const { clientId, clientSecret, tenantId } = getMicrosoftConfig()

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to refresh Microsoft token: ${text}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  }
}

// ─── EMAIL FETCHING & OPERATIONS ─────────────────────────────────────

// Ensures that the access token on an email account is refreshed if expired
export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  })

  if (!account) throw new Error('Email connection not found')

  // Check if token expires in the next 5 minutes
  const now = new Date()
  const bufferTime = new Date(now.getTime() + 5 * 60 * 1000)

  if (account.expiresAt <= bufferTime) {
    if (!account.refreshToken) throw new Error('Refresh token is missing. Please reconnect your account.')

    let newAccessToken = ''
    let expiresIn = 3600

    if (account.provider === 'GMAIL') {
      const refreshed = await refreshGoogleToken(account.refreshToken)
      newAccessToken = refreshed.accessToken
      expiresIn = refreshed.expiresIn
    } else {
      const refreshed = await refreshMicrosoftToken(account.refreshToken)
      newAccessToken = refreshed.accessToken
      expiresIn = refreshed.expiresIn
    }

    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        accessToken: newAccessToken,
        expiresAt: new Date(now.getTime() + expiresIn * 1000),
      },
    })

    return newAccessToken
  }

  return account.accessToken
}

export type RawEmailMessage = {
  providerMessageId: string
  providerThreadId: string
  from: string
  to: string
  subject: string
  body: string
  sentAt: Date
}

// Helper to pull messages from Gmail
export async function fetchGmailMessages(accessToken: string, maxResults = 20): Promise<RawEmailMessage[]> {
  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!listRes.ok) return []

  const listData = await listRes.json()
  const messages = listData.messages || []
  const result: RawEmailMessage[] = []

  for (const msgRef of messages) {
    const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    
    if (!detailRes.ok) continue
    const detail = await detailRes.json()

    // Extract headers
    const headers = detail.payload.headers || []
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
    
    const from = getHeader('from')
    const to = getHeader('to')
    const subject = getHeader('subject') || '(No Subject)'
    const dateStr = getHeader('date')
    const sentAt = dateStr ? new Date(dateStr) : new Date()

    // Extract body content
    let body = ''
    const parsePart = (part: any) => {
      if (part.body?.data) {
        const decoded = Buffer.from(part.body.data, 'base64').toString('utf8')
        if (part.mimeType === 'text/html') {
          body = decoded
        } else if (part.mimeType === 'text/plain' && !body) {
          body = decoded
        }
      }
      if (part.parts) {
        part.parts.forEach(parsePart)
      }
    }

    if (detail.payload.parts) {
      detail.payload.parts.forEach(parsePart)
    } else {
      parsePart(detail.payload)
    }

    result.push({
      providerMessageId: detail.id,
      providerThreadId: detail.threadId,
      from,
      to,
      subject,
      body,
      sentAt,
    })
  }

  return result
}

// Helper to pull messages from MS Graph
export async function fetchMicrosoftMessages(accessToken: string, maxResults = 20): Promise<RawEmailMessage[]> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$select=id,conversationId,from,toRecipients,subject,body,sentDateTime`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return []

  const data = await res.json()
  const messages = data.value || []

  return messages.map((msg: any) => {
    const fromEmail = msg.from?.emailAddress?.address || ''
    const toEmails = (msg.toRecipients || []).map((r: any) => r.emailAddress?.address).join(', ')
    const bodyContent = msg.body?.content || ''

    return {
      providerMessageId: msg.id,
      providerThreadId: msg.conversationId,
      from: fromEmail,
      to: toEmails,
      subject: msg.subject || '(No Subject)',
      body: bodyContent,
      sentAt: new Date(msg.sentDateTime || Date.now()),
    }
  })
}

// Send New Gmail (Starts a new Thread)
export async function sendNewGmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; providerMessageId?: string; providerThreadId?: string; error?: string }> {
  try {
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      body,
    ].join('\r\n')

    const base64Safe = Buffer.from(headers)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Safe,
      }),
    })

    if (!sendRes.ok) {
      const err = await sendRes.text()
      return { success: false, error: err }
    }

    const data = await sendRes.json()
    return { success: true, providerMessageId: data.id, providerThreadId: data.threadId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown Google send error' }
  }
}

// Send Gmail Reply
export async function sendGmailReply(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId: string,
  inReplyToMessageId: string
): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  try {
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${inReplyToMessageId}`,
      `References: ${inReplyToMessageId}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      body,
    ].join('\r\n')

    const base64Safe = Buffer.from(headers)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Safe,
        threadId,
      }),
    })

    if (!sendRes.ok) {
      const err = await sendRes.text()
      return { success: false, error: err }
    }

    const data = await sendRes.json()
    return { success: true, providerMessageId: data.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown Google send error' }
  }
}

// Send Microsoft Graph Reply
export async function sendMicrosoftReply(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId: string
): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  try {
    const sendRes = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: 'HTML',
            content: body,
          },
          toRecipients: to.split(',').map((email) => ({
            emailAddress: { address: email.trim() },
          })),
        },
        saveToSentItems: 'true',
      }),
    })

    if (!sendRes.ok) {
      const err = await sendRes.text()
      return { success: false, error: err }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown Microsoft send error' }
  }
}
