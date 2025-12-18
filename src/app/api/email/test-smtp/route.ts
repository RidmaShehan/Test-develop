import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { verifySMTPConnection, getSMTPConfig } from '@/lib/smtp'

/**
 * Test SMTP Configuration Endpoint
 * GET /api/email/test-smtp
 * 
 * This endpoint helps debug SMTP configuration issues by:
 * - Checking if all required environment variables are set
 * - Verifying SMTP connection
 * - Providing detailed error messages and troubleshooting tips
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request)

    // Get current configuration (without throwing errors)
    const config = getSMTPConfig()
    const provider = process.env.SMTP_PROVIDER || 'mailjet'

    // Check configuration completeness
    const configStatus = {
      provider,
      host: {
        value: config.host || 'NOT SET',
        set: !!config.host,
        envVar: 'SMTP_HOST (or provider default)'
      },
      port: {
        value: config.port,
        set: !!config.port,
        envVar: 'SMTP_PORT (or provider default)'
      },
      user: {
        value: config.auth.user ? '***SET***' : 'NOT SET',
        set: !!config.auth.user,
        envVar: 'SMTP_USER'
      },
      pass: {
        value: config.auth.pass ? '***SET***' : 'NOT SET',
        set: !!config.auth.pass,
        envVar: 'SMTP_PASS'
      },
      from: {
        value: config.from || 'NOT SET',
        set: !!config.from,
        envVar: 'SMTP_FROM'
      },
      fromName: {
        value: config.fromName || 'NOT SET',
        set: !!config.fromName,
        envVar: 'SMTP_FROM_NAME (optional)'
      },
      secure: {
        value: config.secure,
        envVar: 'SMTP_SECURE (true for port 465, false for 587)'
      }
    }

    // Verify connection
    const connectionResult = await verifySMTPConnection()

    // Determine what's missing
    const missing = []
    if (!config.host) missing.push('SMTP_HOST')
    if (!config.auth.user) missing.push('SMTP_USER')
    if (!config.auth.pass) missing.push('SMTP_PASS')
    if (!config.from) missing.push('SMTP_FROM')

    // Provider-specific setup instructions
    const providerInstructions: Record<string, string> = {
      mailjet: `
1. Sign up at https://www.mailjet.com/
2. Go to Account Settings → API Keys
3. Copy your API Key and Secret Key
4. Add to .env:
   SMTP_PROVIDER=mailjet
   SMTP_USER=your_api_key
   SMTP_PASS=your_secret_key
   SMTP_FROM=your-email@example.com
   SMTP_PORT=587
   SMTP_SECURE=false
5. Verify your sender email in Mailjet dashboard (Settings → Senders & Domains)
6. If port 587 doesn't work, try:
   - Port 465 with SSL: SMTP_PORT=465, SMTP_SECURE=true
   - Port 25: SMTP_PORT=25, SMTP_SECURE=false (may be blocked)
      `,
      sendpulse: `
1. Sign up at https://sendpulse.com/
2. Go to Settings → SMTP
3. Copy your User ID and Secret
4. Add to .env:
   SMTP_PROVIDER=sendpulse
   SMTP_USER=your_user_id
   SMTP_PASS=your_secret
   SMTP_FROM=your-email@example.com
      `,
      sendgrid: `
1. Sign up at https://sendgrid.com/
2. Go to Settings → API Keys → Create API Key
3. Copy the API key (shown only once!)
4. Add to .env:
   SMTP_PROVIDER=sendgrid
   SMTP_USER=apikey
   SMTP_PASS=your_api_key
   SMTP_FROM=your-email@example.com
5. Verify your sender email in SendGrid dashboard
      `,
      gmail: `
1. Enable 2-Step Verification on Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to .env:
   SMTP_PROVIDER=gmail
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your_16_char_app_password
   SMTP_FROM=your-email@gmail.com
      `,
      elastic: `
1. Sign up at https://elasticemail.com/
2. Go to Settings → SMTP
3. Copy your Username and API Key
4. Add to .env:
   SMTP_PROVIDER=elastic
   SMTP_USER=your_username
   SMTP_PASS=your_api_key
   SMTP_FROM=your-email@example.com
      `
    }

    return NextResponse.json({
      success: connectionResult.success,
      message: connectionResult.success 
        ? 'SMTP configuration is valid and connection successful! ✅' 
        : 'SMTP configuration has issues. See details below.',
      error: connectionResult.error,
      configuration: configStatus,
      missingVariables: missing,
      connectionDetails: connectionResult.details,
      setupInstructions: providerInstructions[provider] || 'See SMTP_SETUP_GUIDE.md for instructions',
      troubleshooting: {
        commonIssues: [
          'Make sure all required environment variables are set in your .env file',
          'Restart your server after changing environment variables',
          'Verify your sender email is verified with the SMTP provider',
          'Check if your IP address is blocked by the provider',
          'For Gmail: Use App Password, not your regular password',
          'For SendGrid: Use "apikey" as SMTP_USER',
          'Try different ports: 587 (TLS) or 465 (SSL)',
        ],
        nextSteps: missing.length > 0
          ? `Set these environment variables: ${missing.join(', ')}`
          : 'Check the error message above for specific connection issues'
      }
    })
  } catch (error) {
    console.error('Error testing SMTP:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test SMTP configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

