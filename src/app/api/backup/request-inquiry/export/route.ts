import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'
import * as XLSX from 'xlsx'

type ExhibitionVisitorRow = {
  id: string
  name: string
  workPhone: string
  isConverted: boolean
  convertedAt: Date | null
  createdAt: Date
}
type ProgramRow = {
  id: number
  programName: string
  category: string | null
  isActive: boolean
  createdAt: Date
}
type VisitorProgramRow = {
  id: string
  visitorId: string
  programId: number
  createdAt: Date
}
type VisitorMetadataRow = {
  id: string
  visitorId: string
  ipAddress: string | null
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  userAgent: string | null
  browser: string | null
  device: string | null
  submissionDate: Date | null
  submissionTime: Date | null
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const [visitors, programs, visitorPrograms, visitorMetadata] = (await Promise.all([
      requestInquiryPrisma.exhibitionVisitor.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      requestInquiryPrisma.program.findMany({
        orderBy: { id: 'asc' },
      }),
      requestInquiryPrisma.visitorProgram.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      requestInquiryPrisma.visitorMetadata.findMany({
        orderBy: { createdAt: 'asc' },
      }),
    ])) as [ExhibitionVisitorRow[], ProgramRow[], VisitorProgramRow[], VisitorMetadataRow[]]

    const workbook = XLSX.utils.book_new()

    const visitorsData = visitors.map((v) => ({
      id: v.id,
      name: v.name,
      work_phone: v.workPhone,
      is_converted: v.isConverted,
      converted_at: v.convertedAt ? v.convertedAt.toISOString() : '',
      created_at: v.createdAt.toISOString(),
    }))
    const wsVisitors = XLSX.utils.json_to_sheet(visitorsData)
    XLSX.utils.book_append_sheet(workbook, wsVisitors, 'Exhibition Visitors')

    const programsData = programs.map((p) => ({
      id: p.id,
      program_name: p.programName,
      category: p.category ?? '',
      is_active: p.isActive,
      created_at: p.createdAt.toISOString(),
    }))
    const wsPrograms = XLSX.utils.json_to_sheet(programsData)
    XLSX.utils.book_append_sheet(workbook, wsPrograms, 'Programs')

    const vpData = visitorPrograms.map((vp) => ({
      id: vp.id,
      visitor_id: vp.visitorId,
      program_id: vp.programId,
      created_at: vp.createdAt.toISOString(),
    }))
    const wsVisitorPrograms = XLSX.utils.json_to_sheet(vpData)
    XLSX.utils.book_append_sheet(workbook, wsVisitorPrograms, 'Visitor Programs')

    const metaData = visitorMetadata.map((m) => ({
      id: m.id,
      visitor_id: m.visitorId,
      ip_address: m.ipAddress ?? '',
      country: m.country ?? '',
      city: m.city ?? '',
      region: m.region ?? '',
      timezone: m.timezone ?? '',
      user_agent: m.userAgent ?? '',
      browser: m.browser ?? '',
      device: m.device ?? '',
      submission_date: m.submissionDate ? m.submissionDate.toISOString().slice(0, 10) : '',
      submission_time: m.submissionTime ? m.submissionTime.toString() : '',
      created_at: m.createdAt.toISOString(),
    }))
    const wsMetadata = XLSX.utils.json_to_sheet(metaData)
    XLSX.utils.book_append_sheet(workbook, wsMetadata, 'Visitor Metadata')

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const filename = `request-inquiry-migration-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Request Inquiry spreadsheet export error:', err)
    return NextResponse.json(
      { error: 'Failed to generate Request Inquiry spreadsheet export' },
      { status: 500 }
    )
  }
}
