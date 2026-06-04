import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { createInquiryFromBody } from '@/lib/inquiry-create-internal'
import {
  INQUIRY_IMPORT_HEADERS,
  INQUIRY_IMPORT_SHEET_NAME,
  getInquiryImportPassword,
  normalizeImportCell,
  validateInquiryImportHeaders,
} from '@/lib/inquiry-import-template'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 500

function parseYesNo(value: unknown): boolean {
  const s = normalizeImportCell(value).toLowerCase()
  return s === 'yes' || s === 'true' || s === '1' || s === 'y'
}

function rowIsCompletelyEmpty(cells: string[]): boolean {
  return cells.every((c) => !c || c.trim() === '')
}

/** POST — import inquiries from official template (password + campaign + marketing source). */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const formData = await request.formData()
    const file = formData.get('file')
    const importPassword = formData.get('importPassword')
    const campaignId = formData.get('campaignId')
    const marketingSourceRaw = formData.get('marketingSource')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Excel file is required.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File is too large (max ${MAX_FILE_BYTES / (1024 * 1024)} MB).` },
        { status: 400 }
      )
    }

    const passwordOk =
      typeof importPassword === 'string' &&
      importPassword === getInquiryImportPassword()
    if (!passwordOk) {
      return NextResponse.json({ error: 'Incorrect import password.' }, { status: 403 })
    }

    const campaignIdStr =
      typeof campaignId === 'string' && campaignId.trim() ? campaignId.trim() : ''
    if (!campaignIdStr) {
      return NextResponse.json({ error: 'Campaign is required.' }, { status: 400 })
    }

    const marketingSourceStr =
      typeof marketingSourceRaw === 'string' && marketingSourceRaw.trim()
        ? marketingSourceRaw.trim()
        : ''
    if (!marketingSourceStr) {
      return NextResponse.json({ error: 'Marketing source is required.' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignIdStr, isDeleted: false },
      select: { id: true },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 400 })
    }

    const campaignType = await prisma.campaignType.findFirst({
      where: {
        isActive: true,
        name: { equals: marketingSourceStr, mode: 'insensitive' },
      },
      select: { name: true },
    })
    if (!campaignType) {
      return NextResponse.json(
        { error: 'Marketing source is not valid. Pick an active marketing source from the list.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch {
      return NextResponse.json(
        { error: 'Could not read the Excel file. Use the official .xlsx template.' },
        { status: 400 }
      )
    }

    const sheet = workbook.Sheets[INQUIRY_IMPORT_SHEET_NAME]
    if (!sheet) {
      return NextResponse.json(
        {
          error: `Missing sheet "${INQUIRY_IMPORT_SHEET_NAME}". Download the official template and do not rename the sheet.`,
        },
        { status: 400 }
      )
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][]

    const headerCheck = validateInquiryImportHeaders(rows)
    if (!headerCheck.ok) {
      return NextResponse.json({ error: headerCheck.message }, { status: 400 })
    }

    const dataRowCount = Math.max(0, rows.length - 1)
    if (dataRowCount > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${MAX_ROWS} data rows per import).` },
        { status: 400 }
      )
    }

    const programs = await prisma.program.findMany({
      select: { id: true, name: true },
    })
    const programByNameLower = new Map<string, string>()
    for (const p of programs) {
      programByNameLower.set(p.name.trim().toLowerCase(), p.id)
    }

    let created = 0
    const errors: { row: number; message: string }[] = []

    for (let i = 1; i < rows.length; i++) {
      const excelRow = i + 1
      const raw = rows[i] as unknown[]
      const cells = INQUIRY_IMPORT_HEADERS.map((_, j) => normalizeImportCell(raw[j]))

      if (rowIsCompletelyEmpty(cells)) continue

      const fullName = cells[0]
      const phone = cells[1]

      if (!fullName) {
        errors.push({ row: excelRow, message: 'Full Name is required.' })
        continue
      }
      if (!phone) {
        errors.push({ row: excelRow, message: 'Phone is required.' })
        continue
      }

      const whatsapp = parseYesNo(cells[2])
      const whatsappNumberRaw = cells[3]
      const whatsappNumber =
        whatsappNumberRaw.trim() !== ''
          ? whatsappNumberRaw
          : whatsapp
            ? phone
            : ''

      const preferredStatusRaw = cells[9]
      let preferredStatus: number | null = null
      if (preferredStatusRaw !== '') {
        const n = parseInt(preferredStatusRaw, 10)
        if (Number.isNaN(n) || n < 1 || n > 10) {
          errors.push({
            row: excelRow,
            message: 'Preferred Status must be empty or a number from 1 to 10.',
          })
          continue
        }
        preferredStatus = n
      }

      const programNames = cells[13]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const preferredProgramIds: string[] = []
      const unknownPrograms: string[] = []
      for (const name of programNames) {
        const id = programByNameLower.get(name.toLowerCase())
        if (id) preferredProgramIds.push(id)
        else unknownPrograms.push(name)
      }

      const body: Record<string, any> = {
        fullName,
        phone,
        whatsapp,
        whatsappNumber: whatsappNumber || null,
        notAnswering: false,
        email: cells[4] || null,
        emailNotAnswering: false,
        city: cells[5] || null,
        ageBand: cells[6] ? String(cells[6]) : null,
        guardianPhone: cells[7] || null,
        marketingSource: campaignType.name,
        campaignId: campaignIdStr,
        preferredContactTime: cells[8] || null,
        preferredStatus,
        followUpAgain: false,
        description: cells[10] || null,
        consent: parseYesNo(cells[11]),
        registerNow: parseYesNo(cells[12]),
        preferredProgramIds,
        programInterestId: preferredProgramIds[0] ?? undefined,
        promotionCodeId: null,
      }

      if (unknownPrograms.length > 0) {
        errors.push({
          row: excelRow,
          message: `Unknown program name(s): ${unknownPrograms.join(', ')}. Fix spelling or leave blank.`,
        })
        continue
      }

      try {
        await createInquiryFromBody({
          body,
          userId: user.id,
          request,
        })
        created++
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create inquiry.'
        errors.push({ row: excelRow, message: msg })
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error importing inquiries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed.' },
      { status: 500 }
    )
  }
}
