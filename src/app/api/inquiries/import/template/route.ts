import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import {
  INQUIRY_IMPORT_HEADERS,
  INQUIRY_IMPORT_SHEET_NAME,
} from '@/lib/inquiry-import-template'

/** GET — download official inquiry import Excel template (authenticated). */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const workbook = XLSX.utils.book_new()
    const headerRow = [...INQUIRY_IMPORT_HEADERS]
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow])
    XLSX.utils.book_append_sheet(workbook, worksheet, INQUIRY_IMPORT_SHEET_NAME)

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="inquiry-import-template.xlsx"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error generating inquiry import template:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
