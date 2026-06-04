/** Official Excel import template for inquiries (sheet + header order must match exactly). */

export const INQUIRY_IMPORT_SHEET_NAME = 'InquiryImport' as const

export const INQUIRY_IMPORT_HEADERS = [
  'Full Name',
  'Phone',
  'WhatsApp (yes/no)',
  'WhatsApp Number',
  'Email',
  'City / District',
  'Age',
  'Guardian Phone',
  'Preferred Contact Time',
  'Preferred Status (1-10)',
  'Description',
  'Consent (yes/no)',
  'Register Now (yes/no)',
  'Program names (comma-separated)',
] as const

export function normalizeImportCell(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ''
    return String(value).trim()
  }
  return String(value).trim()
}

export function validateInquiryImportHeaders(
  rows: unknown[][]
): { ok: true } | { ok: false; message: string } {
  if (!rows.length) {
    return {
      ok: false,
      message: 'The file is empty. Download the official inquiry import template.',
    }
  }
  const header = (rows[0] as unknown[]).map(normalizeImportCell)
  if (header.length !== INQUIRY_IMPORT_HEADERS.length) {
    return {
      ok: false,
      message:
        'Invalid file: column count does not match the official template. Download the template and do not change the header row.',
    }
  }
  for (let i = 0; i < INQUIRY_IMPORT_HEADERS.length; i++) {
    if (header[i] !== INQUIRY_IMPORT_HEADERS[i]) {
      return {
        ok: false,
        message: `Invalid template: column ${i + 1} must be exactly "${INQUIRY_IMPORT_HEADERS[i]}". Download the official template.`,
      }
    }
  }
  return { ok: true }
}

/** Default password from product spec; override with INQUIRY_IMPORT_PASSWORD in env. */
export const DEFAULT_INQUIRY_IMPORT_PASSWORD = 'Tshe@2026'

export function getInquiryImportPassword(): string {
  const fromEnv = process.env.INQUIRY_IMPORT_PASSWORD?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_INQUIRY_IMPORT_PASSWORD
}
