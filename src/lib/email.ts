import { sendEmailViaSMTP } from '@/lib/smtp'

// ─── DOCUMENT REQUEST EMAIL ────────────────────────────────

export async function sendDocumentRequestEmail(params: {
  toEmail: string
  toName: string
  documentName: string
  programName: string
  counselorName: string
  dueDate?: Date
  portalLink: string
  message?: string
}) {
  const dueDateStr = params.dueDate
    ? params.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'as soon as possible'

  return sendEmailViaSMTP({
    to: params.toEmail,
    subject: `Action required: Please upload your ${params.documentName}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; color: #1a1a2e; margin: 0; background: #f8fafc; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%); padding: 32px; text-align: center; }
        .header h1 { color: #fff; font-size: 20px; margin: 0; }
        .body { padding: 32px; }
        .doc-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .doc-name { font-weight: 600; color: #0369a1; font-size: 15px; }
        .btn { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 20px 0; }
        .due { background: #fef9c3; border: 1px solid #fde047; border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #713f12; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
        p { line-height: 1.6; color: #374151; font-size: 14px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1>Document Required</h1></div>
          <div class="body">
            <p>Dear <strong>${params.toName}</strong>,</p>
            <p>Your counselor <strong>${params.counselorName}</strong> has requested the following document for your <strong>${params.programName}</strong> application:</p>
            <div class="doc-box"><div class="doc-name">📄 ${params.documentName}</div></div>
            ${params.message ? `<p><em>"${params.message}"</em></p>` : ''}
            <div class="due">⏰ <strong>Please upload by:</strong> ${dueDateStr}</div>
            <p style="text-align:center"><a href="${params.portalLink}" class="btn">Upload Document →</a></p>
          </div>
          <div class="footer"><p>EduCRM — Automated notification</p></div>
        </div>
      </body></html>
    `,
  })
}

// ─── DOCUMENT REMINDER EMAIL ───────────────────────────────

export async function sendDocumentReminderEmail(params: {
  toEmail: string
  toName: string
  documentName: string
  daysRemaining: number
  portalLink: string
  reminderCount: number
}) {
  const urgency = params.daysRemaining <= 1 ? 'URGENT: ' : params.daysRemaining <= 3 ? 'Reminder: ' : ''
  const headerColor =
    params.daysRemaining <= 1 ? '#dc2626' : params.daysRemaining <= 3 ? '#d97706' : '#0369a1'

  return sendEmailViaSMTP({
    to: params.toEmail,
    subject: `${urgency}Your ${params.documentName} is still pending`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; margin: 0; background: #f8fafc; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: ${headerColor}; padding: 24px 32px; }
        .header h1 { color: #fff; font-size: 18px; margin: 0; }
        .body { padding: 32px; }
        .countdown { font-size: 32px; font-weight: 700; color: ${params.daysRemaining <= 1 ? '#dc2626' : '#d97706'}; text-align: center; margin: 16px 0; }
        .btn { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
        p { line-height: 1.6; color: #374151; font-size: 14px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1>${urgency}Document Reminder (${params.reminderCount} of 4)</h1></div>
          <div class="body">
            <p>Dear <strong>${params.toName}</strong>,</p>
            <p>Your <strong>${params.documentName}</strong> is still pending.</p>
            <div class="countdown">${params.daysRemaining <= 0 ? 'OVERDUE' : `${params.daysRemaining} day${params.daysRemaining !== 1 ? 's' : ''} left`}</div>
            <p style="text-align:center"><a href="${params.portalLink}" class="btn">Upload Now →</a></p>
          </div>
        </div>
      </body></html>
    `,
  })
}

// ─── DOCUMENT VERIFIED EMAIL ──────────────────────────────

export async function sendDocumentVerifiedEmail(params: {
  toEmail: string
  toName: string
  documentName: string
  programName: string
}) {
  return sendEmailViaSMTP({
    to: params.toEmail,
    subject: `Your ${params.documentName} has been verified`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #16a34a; padding: 24px 32px; }
        .header h1 { color: #fff; margin: 0; font-size: 18px; }
        .body { padding: 32px; }
        .check { text-align: center; font-size: 48px; margin: 16px 0; }
        p { line-height: 1.6; color: #374151; font-size: 14px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1>Document Verified ✅</h1></div>
          <div class="body">
            <div class="check">✅</div>
            <p>Dear <strong>${params.toName}</strong>,</p>
            <p>Your <strong>${params.documentName}</strong> for <strong>${params.programName}</strong> has been verified and accepted.</p>
            <p>No further action is required for this document.</p>
          </div>
        </div>
      </body></html>
    `,
  })
}

// ─── DOCUMENT REJECTED EMAIL ──────────────────────────────

export async function sendDocumentRejectedEmail(params: {
  toEmail: string
  toName: string
  documentName: string
  reason: string
  portalLink: string
}) {
  return sendEmailViaSMTP({
    to: params.toEmail,
    subject: `Action required: Re-upload your ${params.documentName}`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #dc2626; padding: 24px 32px; }
        .header h1 { color: #fff; margin: 0; font-size: 18px; }
        .body { padding: 32px; }
        .reason-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0; font-size: 14px; color: #991b1b; }
        .btn { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
        p { line-height: 1.6; color: #374151; font-size: 14px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1>Document Rejected — Action Required</h1></div>
          <div class="body">
            <p>Dear <strong>${params.toName}</strong>,</p>
            <p>Unfortunately, your <strong>${params.documentName}</strong> could not be accepted:</p>
            <div class="reason-box">❌ ${params.reason}</div>
            <p>Please re-upload a corrected document:</p>
            <p style="text-align:center;margin:24px 0"><a href="${params.portalLink}" class="btn">Re-upload Document →</a></p>
          </div>
        </div>
      </body></html>
    `,
  })
}

// ─── INVOICE EMAIL ─────────────────────────────────────────

export async function sendInvoiceEmail(params: {
  toEmail: string
  toName: string
  invoiceNo: string
  total: number
  dueDate?: Date
  portalLink: string
}) {
  const dueDateStr = params.dueDate
    ? params.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'upon receipt'

  return sendEmailViaSMTP({
    to: params.toEmail,
    subject: `Invoice ${params.invoiceNo} — EduCRM`,
    html: `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #1e3a5f; padding: 24px 32px; }
        .header h1 { color: #fff; margin: 0; font-size: 18px; }
        .body { padding: 32px; }
        .amount { font-size: 36px; font-weight: 700; color: #1e3a5f; text-align: center; margin: 16px 0; }
        .btn { display: inline-block; background: #0ea5e9; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
        p { line-height: 1.6; color: #374151; font-size: 14px; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1>Invoice ${params.invoiceNo}</h1></div>
          <div class="body">
            <p>Dear <strong>${params.toName}</strong>,</p>
            <p>Please find your invoice details below:</p>
            <div class="amount">LKR ${params.total.toLocaleString()}</div>
            <p style="text-align:center">Due: <strong>${dueDateStr}</strong></p>
            <p style="text-align:center;margin:24px 0"><a href="${params.portalLink}" class="btn">View Invoice →</a></p>
          </div>
        </div>
      </body></html>
    `,
  })
}
