import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission, ForbiddenError } from '@/lib/authorization'
import { sendEmailViaSMTP } from '@/lib/smtp'
import { AuthenticationError } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('UPDATE_SETTINGS', req)
    const { to } = await req.json()

    const target = to || user.email
    await sendEmailViaSMTP({
      to: target,
      subject: 'EduCRM SMTP Test',
      html: `<p>This is a test email from EduCRM. SMTP is working correctly!</p><p>Sent to: ${target}</p>`,
    })

    return NextResponse.json({ success: true, message: `Test email sent to ${target}` })
  } catch (err: any) {
    if (err instanceof AuthenticationError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}
