import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendEmailViaSMTP, verifySMTPConnection } from '@/lib/smtp'

interface SeekerData {
  id: string
  fullName: string
  email?: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Parse multipart form data
    const formData = await request.formData()
    const seekersJson = formData.get('seekers') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string

    if (!seekersJson || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: seekers, subject, or message' },
        { status: 400 }
      )
    }

    const seekers: SeekerData[] = JSON.parse(seekersJson)

    if (!Array.isArray(seekers) || seekers.length === 0) {
      return NextResponse.json(
        { error: 'No seekers provided' },
        { status: 400 }
      )
    }

    // Filter seekers with email addresses
    const seekersWithEmail = seekers.filter(seeker => seeker.email)

    if (seekersWithEmail.length === 0) {
      return NextResponse.json(
        { error: 'No seekers with email addresses found' },
        { status: 400 }
      )
    }

    // Parse attachments from form data
    const attachments: Array<{ filename: string; content: string; mimeType: string; size: number }> = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment-') && value instanceof File) {
        const file = value
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Content = buffer.toString('base64')

        attachments.push({
          filename: file.name,
          content: base64Content,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        })
      }
    }

    // Verify SMTP connection
    try {
      const connectionResult = await verifySMTPConnection()
      if (!connectionResult.success) {
        return NextResponse.json(
          {
            error: connectionResult.error || 'SMTP connection failed',
            details: connectionResult.details,
            help: 'Please check your SMTP configuration in environment variables. See SMTP_SETUP_GUIDE.md for setup instructions.'
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Failed to verify SMTP connection:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        {
          error: 'SMTP configuration error',
          details: errorMessage,
          help: 'Please configure SMTP settings in environment variables. See SMTP_SETUP_GUIDE.md for setup instructions.'
        },
        { status: 500 }
      )
    }

    // Create email message record
    const emailMessage = await prisma.emailMessage.create({
      data: {
        subject,
        message,
        recipientCount: seekersWithEmail.length,
        sentCount: 0,
        failedCount: 0,
        sentAt: new Date(),
        userId: user.id,
      },
    })

    // Create attachment records if any
    if (attachments.length > 0) {
      await prisma.emailAttachment.createMany({
        data: attachments.map(att => ({
          emailMessageId: emailMessage.id,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          content: att.content,
        })),
      })
    }

    // Send emails to all recipients
    let sentCount = 0
    let failedCount = 0
    const results = []

    for (const seeker of seekersWithEmail) {
      if (!seeker.email) continue

      try {
        // Personalize message with seeker name
        const personalizedMessage = message.replace(
          /\{name\}/gi,
          seeker.fullName || 'there'
        )

        // Convert message to HTML format
        const htmlMessage = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              ${personalizedMessage.split('\n').map(line => `<p>${line}</p>`).join('')}
              <br/>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
              <p style="font-size: 12px; color: #666;">
                This email was sent via the CRM System
              </p>
            </body>
          </html>
        `

        // Prepare attachments for SMTP
        const smtpAttachments = attachments.length > 0
          ? attachments.map(att => ({
            filename: att.filename,
            content: att.content, // Already base64 encoded
            contentType: att.mimeType,
          }))
          : undefined

        const result = await sendEmailViaSMTP({
          to: seeker.email,
          subject,
          html: htmlMessage,
          attachments: smtpAttachments,
        })

        if (result.success) {
          sentCount++

          // Create recipient record
          await prisma.emailRecipient.create({
            data: {
              emailMessageId: emailMessage.id,
              seekerId: seeker.id,
              email: seeker.email,
              status: 'SENT',
              sentAt: new Date(),
            },
          })

          results.push({
            seekerId: seeker.id,
            email: seeker.email,
            success: true,
          })
        } else {
          failedCount++

          // Create recipient record with error
          await prisma.emailRecipient.create({
            data: {
              emailMessageId: emailMessage.id,
              seekerId: seeker.id,
              email: seeker.email,
              status: 'FAILED',
              errorMessage: result.error,
            },
          })

          results.push({
            seekerId: seeker.id,
            email: seeker.email,
            success: false,
            error: result.error,
          })
        }
      } catch (error) {
        failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Create recipient record with error
        await prisma.emailRecipient.create({
          data: {
            emailMessageId: emailMessage.id,
            seekerId: seeker.id,
            email: seeker.email || 'unknown',
            status: 'FAILED',
            errorMessage,
          },
        })

        results.push({
          seekerId: seeker.id,
          email: seeker.email,
          success: false,
          error: errorMessage,
        })
      }
    }

    // Update email message with final counts
    await prisma.emailMessage.update({
      where: { id: emailMessage.id },
      data: {
        sentCount,
        failedCount,
      },
    })

    return NextResponse.json({
      success: true,
      messageId: emailMessage.id,
      recipientCount: seekersWithEmail.length,
      sentCount,
      failedCount,
      results,
    })
  } catch (error) {
    console.error('Error sending bulk emails:', error)
    return NextResponse.json(
      { error: 'Failed to send emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

