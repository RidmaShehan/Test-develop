import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { sendEmailViaSMTP } from '@/lib/smtp'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
    }

    // Invalidate old tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    await sendEmailViaSMTP({
      to: user.email,
      subject: 'Reset your EduCRM password',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body { font-family: -apple-system, sans-serif; background: #f8fafc; margin: 0; }
          .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%); padding: 32px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 20px; }
          .body { padding: 32px; }
          .btn { display: inline-block; background: #3b82f6; color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 20px 0; }
          p { line-height: 1.6; color: #374151; font-size: 14px; }
          .note { font-size: 12px; color: #6b7280; margin-top: 16px; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>Password Reset Request</h1></div>
            <div class="body">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>We received a request to reset your EduCRM password. Click the button below to set a new password:</p>
              <p style="text-align:center"><a href="${resetUrl}" class="btn">Reset Password</a></p>
              <p>This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
              <p class="note">If the button doesn't work, copy and paste this URL into your browser:<br>${resetUrl}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    return handleApiError(err)
  }
}
