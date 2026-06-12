import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_ROWS = 1000

function normalizeCell(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

// POST /api/request-inquiries/import - Import request inquiries from Excel
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const formData = await request.formData()
    const file = formData.get('file')
    const defaultCoordinatorId = formData.get('defaultCoordinatorId') as string | null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Excel file is required.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File is too large (max ${MAX_FILE_BYTES / (1024 * 1024)} MB).` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' })
    } catch (readErr) {
      console.error('Excel read error:', readErr)
      return NextResponse.json(
        { error: 'Could not read the Excel file.' },
        { status: 400 }
      )
    }

    // Use the first sheet in the workbook
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      return NextResponse.json({ error: 'No sheets found in the Excel file.' }, { status: 400 })
    }

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][]

    if (rows.length < 2) {
      return NextResponse.json({ error: 'The file has no data rows.' }, { status: 400 })
    }

    if (rows.length - 1 > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${MAX_ROWS} data rows per import).` },
        { status: 400 }
      )
    }

    // Find headers mapping (case-insensitive)
    const headers = (rows[0] as unknown[]).map((h) => normalizeCell(h).toLowerCase())
    
    // Find column indexes based on keywords
    const nameIdx = headers.findIndex((h) => h.includes('name'))
    const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('contact'))
    const programIdx = headers.findIndex((h) => h.includes('program') || h.includes('course'))
    const addresseeIdx = headers.findIndex((h) => h.includes('addressee'))
    const coordinatorIdx = headers.findIndex((h) => h.includes('coordinator') || h.includes('coord'))

    if (nameIdx === -1) {
      return NextResponse.json({ error: 'Missing column for "Name" in header row.' }, { status: 400 })
    }
    if (phoneIdx === -1) {
      return NextResponse.json({ error: 'Missing column for "Phone" / "Contact" in header row.' }, { status: 400 })
    }

    // Load active programs from request inquiry DB
    const existingPrograms = await requestInquiryPrisma.program.findMany({
      where: { isActive: true },
    })
    const programMap = new Map<string, number>()
    existingPrograms.forEach((p: any) => {
      programMap.set(p.programName.toLowerCase().trim(), p.id)
    })

    // Load users from main database to match coordinators
    const mainUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    })
    const userMapByName = new Map<string, string>()
    const userMapByEmail = new Map<string, string>()
    mainUsers.forEach((u) => {
      userMapByName.set(u.name.toLowerCase().trim(), u.id)
      if (u.email) {
        userMapByEmail.set(u.email.toLowerCase().trim(), u.id)
      }
    })

    let createdCount = 0
    const errors: { row: number; message: string }[] = []

    // Process rows starting from index 1 (second row)
    for (let i = 1; i < rows.length; i++) {
      const excelRow = i + 1
      const rawRow = rows[i] as unknown[]
      
      // Skip if row is completely empty or has fewer elements than index matches
      if (!rawRow || rawRow.length === 0 || rawRow.every((cell) => cell === undefined || cell === null || String(cell).trim() === '')) {
        continue
      }

      const name = nameIdx < rawRow.length ? normalizeCell(rawRow[nameIdx]) : ''
      const phone = phoneIdx < rawRow.length ? normalizeCell(rawRow[phoneIdx]) : ''

      if (!name) {
        errors.push({ row: excelRow, message: 'Name is required.' })
        continue
      }
      if (!phone) {
        errors.push({ row: excelRow, message: 'Phone is required.' })
        continue
      }

      const rawProgram = (programIdx !== -1 && programIdx < rawRow.length) ? normalizeCell(rawRow[programIdx]) : ''
      const rawAddressee = (addresseeIdx !== -1 && addresseeIdx < rawRow.length) ? normalizeCell(rawRow[addresseeIdx]) : ''
      const rawCoordinator = (coordinatorIdx !== -1 && coordinatorIdx < rawRow.length) ? normalizeCell(rawRow[coordinatorIdx]) : ''

      let programId: number | null = null
      if (rawProgram) {
        const key = rawProgram.toLowerCase().trim()
        if (programMap.has(key)) {
          programId = programMap.get(key)!
        } else {
          // Dynamic program creation in request-inquiry DB
          try {
            const newProgram = await requestInquiryPrisma.program.create({
              data: {
                programName: rawProgram.trim(),
                isActive: true,
              },
            })
            programMap.set(key, newProgram.id)
            programId = newProgram.id
          } catch (progErr) {
            console.error('Error creating program dynamically:', progErr)
          }
        }
      }

      // Determine coordinator ID
      let coordinatorId: string | null = defaultCoordinatorId || null
      if (rawCoordinator) {
        const coordKey = rawCoordinator.toLowerCase().trim()
        if (userMapByName.has(coordKey)) {
          coordinatorId = userMapByName.get(coordKey)!
        } else if (userMapByEmail.has(coordKey)) {
          coordinatorId = userMapByEmail.get(coordKey)!
        }
      }

      try {
        await requestInquiryPrisma.exhibitionVisitor.create({
          data: {
            name: name.trim(),
            workPhone: phone.trim(),
            addressee: rawAddressee.trim() || null,
            coordinatorId: coordinatorId,
            programs: programId ? {
              create: {
                programId: programId,
              },
            } : undefined,
          },
        })
        createdCount++
      } catch (visitorErr) {
        console.error('Error importing visitor:', visitorErr)
        errors.push({
          row: excelRow,
          message: visitorErr instanceof Error ? visitorErr.message : 'Database insert error.',
        })
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      failed: errors.length,
      errors,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error importing request inquiries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed.' },
      { status: 500 }
    )
  }
}
