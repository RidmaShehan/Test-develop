// SMTP Email Service Configuration
// Supports multiple free SMTP providers:
// - Mailjet (Recommended): 6,000 emails/month free
// - SendPulse: 12,000 emails/month free
// - SendGrid: 100 emails/day free (60 days trial)
// - Elastic Email: 100 emails/day free
// - Gmail SMTP: Free with Gmail account

import nodemailer from 'nodemailer'

export interface SMTPConfig {
  host: string
  port: number
  secure: boolean // true for 465, false for other ports
  auth: {
    user: string
    pass: string
  }
  from: string // Sender email address
  fromName?: string // Sender name
}

// Get SMTP configuration from environment variables
export function getSMTPConfig(): SMTPConfig {
  const provider = process.env.SMTP_PROVIDER || 'mailjet' // mailjet, sendpulse, sendgrid, gmail, custom

  // Mailjet SMTP (Recommended - 6,000 emails/month free)
  // Port options: 587 (TLS), 465 (SSL), or 25 (some providers block this)
  if (provider === 'mailjet') {
    const port = parseInt(process.env.SMTP_PORT || '587')
    const useSSL = process.env.SMTP_SECURE === 'true' || port === 465
    const useTLS = !useSSL && port !== 25
    
    return {
      host: process.env.SMTP_HOST || 'in-v3.mailjet.com',
      port,
      secure: useSSL, // true for SSL (port 465), false for TLS (port 587) or plain (port 25)
      auth: {
        user: process.env.SMTP_USER || process.env.MAILJET_API_KEY || '',
        pass: process.env.SMTP_PASS || process.env.MAILJET_API_SECRET || '',
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      fromName: process.env.SMTP_FROM_NAME || 'CRM System',
      // TLS configuration
      ...(useTLS && {
        requireTLS: false, // TLS is optional for Mailjet
      }),
    }
  }

  // SendPulse SMTP (12,000 emails/month free)
  if (provider === 'sendpulse') {
    return {
      host: process.env.SMTP_HOST || 'smtp.sendpulse.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.SENDPULSE_USER_ID || '',
        pass: process.env.SMTP_PASS || process.env.SENDPULSE_SECRET || '',
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      fromName: process.env.SMTP_FROM_NAME || 'CRM System',
    }
  }

  // SendGrid SMTP (100 emails/day free for 60 days)
  if (provider === 'sendgrid') {
    return {
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || '',
      },
      from: process.env.SMTP_FROM || '',
      fromName: process.env.SMTP_FROM_NAME || 'CRM System',
    }
  }

  // Gmail SMTP (Free with Gmail account)
  if (provider === 'gmail') {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.GMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '',
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      fromName: process.env.SMTP_FROM_NAME || 'CRM System',
    }
  }

  // Elastic Email SMTP (100 emails/day free)
  if (provider === 'elastic') {
    return {
      host: process.env.SMTP_HOST || 'smtp.elasticemail.com',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.ELASTIC_USERNAME || '',
        pass: process.env.SMTP_PASS || process.env.ELASTIC_API_KEY || '',
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      fromName: process.env.SMTP_FROM_NAME || 'CRM System',
    }
  }

  // Custom SMTP configuration
  return {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    fromName: process.env.SMTP_FROM_NAME || 'CRM System',
  }
}

// Create nodemailer transporter
let transporter: nodemailer.Transporter | null = null

export function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter
  }

  const config = getSMTPConfig()

  // Validate configuration
  if (!config.host || !config.auth.user || !config.auth.pass || !config.from) {
    throw new Error(
      'SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM environment variables.'
    )
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for SSL (465), false for TLS (587) or plain (25)
    auth: config.auth,
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
      // TLS is optional for Mailjet
      ciphers: 'SSLv3',
    },
    // Connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  return transporter
}

// Verify SMTP connection with detailed error information
export async function verifySMTPConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    const config = getSMTPConfig()
    
    // Check if configuration is complete
    if (!config.host || !config.auth.user || !config.auth.pass || !config.from) {
      const missing = []
      if (!config.host) missing.push('SMTP_HOST')
      if (!config.auth.user) missing.push('SMTP_USER')
      if (!config.auth.pass) missing.push('SMTP_PASS')
      if (!config.from) missing.push('SMTP_FROM')
      
      return {
        success: false,
        error: `Missing required SMTP configuration: ${missing.join(', ')}`,
        details: {
          provider: process.env.SMTP_PROVIDER || 'mailjet',
          host: config.host || 'NOT SET',
          user: config.auth.user ? 'SET' : 'NOT SET',
          pass: config.auth.pass ? 'SET' : 'NOT SET',
          from: config.from || 'NOT SET',
        }
      }
    }

    const transporter = getTransporter()
    await transporter.verify()
    
    return { success: true }
  } catch (error) {
    console.error('SMTP verification failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const config = getSMTPConfig()
    
      // Provide provider-specific troubleshooting tips
      const troubleshootingTips: Record<string, string[]> = {
        mailjet: [
          'Check if SMTP credentials (API Key and Secret Key) are correct',
          'Verify your sender email is verified in Mailjet dashboard (Settings → Senders & Domains)',
          'Try port 587 with TLS (default) - set SMTP_PORT=587 and SMTP_SECURE=false',
          'If port 587 doesn\'t work, try port 465 with SSL - set SMTP_PORT=465 and SMTP_SECURE=true',
          'Port 25 may be blocked by your ISP - try 587 or 465 instead',
          'Check if your IP address is blocked by Mailjet',
          'Ensure you\'re using API Key (not Secret Key) for SMTP_USER',
        ],
        sendpulse: [
          'Verify SMTP User ID and Secret are correct',
          'Check sender email verification in SendPulse dashboard',
        ],
        sendgrid: [
          'Username must be exactly "apikey" (lowercase)',
          'Password should be your SendGrid API key',
          'Verify sender email in SendGrid dashboard',
        ],
        gmail: [
          'Use App Password, not your regular Gmail password',
          'Enable 2-Step Verification first, then generate App Password',
          'App Password is 16 characters with spaces - remove spaces when setting',
        ],
      }

      const provider = process.env.SMTP_PROVIDER || 'mailjet'
      
      return {
        success: false,
        error: errorMessage,
        details: {
          provider,
          host: config.host,
          port: config.port,
          secure: config.secure,
          from: config.from,
          commonIssues: troubleshootingTips[provider] || [
            'Check if SMTP credentials are correct',
            'Verify your sender email is verified with the provider',
            'Check if your IP is blocked by the provider',
            'Try different ports: 587 (TLS), 465 (SSL), or 25',
            'Ensure SMTP_PROVIDER matches your service',
          ],
        }
      }
  }
}

// Send email via SMTP
export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string // base64 encoded
    contentType?: string
  }>
}

export async function sendEmailViaSMTP(
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const config = getSMTPConfig()
    const transporter = getTransporter()

    // Convert base64 attachments to Buffer
    const attachments = options.attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType,
    }))

    const mailOptions = {
      from: config.fromName
        ? `${config.fromName} <${config.from}>`
        : config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      attachments,
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Error sending email via SMTP:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

