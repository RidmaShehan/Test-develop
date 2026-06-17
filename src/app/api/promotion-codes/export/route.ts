import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

type PromotionCodeExport = {
  id: string
  code: string
  promoterName: string
  promoterAddress: string
  promoterPhone: string
  promoterIdNumber: string
  discountAmountLKR: number
  paymentAmountLKR: number
  isActive: boolean
  totalInquiries: number
  totalRegistrations: number
  totalPaidLKR: number
  createdAt: string
  createdBy?: { id: string; name: string; email: string } | null
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'excel') as 'excel' | 'pdf'

    if (format !== 'excel' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'Invalid format. Use excel or pdf.' },
        { status: 400 }
      )
    }

    const promotionCodes = await prisma.promotionCode.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const codesWithStats: PromotionCodeExport[] = await Promise.all(
      promotionCodes.map(async (code) => {
        const seekers = await prisma.seeker.findMany({
          where: { promotionCodeId: code.id },
          select: { id: true, stage: true },
        })
        const totalInquiries = seekers.length
        const totalRegistrations = seekers.filter(
          (s) => s.stage === 'READY_TO_REGISTER'
        ).length
        return {
          id: code.id,
          code: code.code,
          promoterName: code.promoterName,
          promoterAddress: code.promoterAddress,
          promoterPhone: code.promoterPhone,
          promoterIdNumber: code.promoterIdNumber,
          discountAmountLKR: code.discountAmountLKR,
          paymentAmountLKR: code.paymentAmountLKR,
          isActive: code.isActive,
          totalInquiries,
          totalRegistrations,
          totalPaidLKR: code.paymentAmountLKR * totalRegistrations,
          createdAt: code.createdAt.toISOString(),
          createdBy: code.createdBy,
        }
      })
    )

    if (format === 'excel') {
      return exportToExcel(codesWithStats)
    }
    return exportToPDF(codesWithStats)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

function exportToExcel(codes: PromotionCodeExport[]) {
  const totalInquiries = codes.reduce((s, c) => s + c.totalInquiries, 0)
  const totalRegistrations = codes.reduce((s, c) => s + c.totalRegistrations, 0)
  const totalPaidLKR = codes.reduce((s, c) => s + c.totalPaidLKR, 0)
  const activeCount = codes.filter((c) => c.isActive).length

  const summaryData = [
    ['Promotion Codes Report', ''],
    ['Generated', new Date().toLocaleString()],
    ['', ''],
    ['Metric', 'Value'],
    ['Total promotion codes', codes.length],
    ['Active codes', activeCount],
    ['Inactive codes', codes.length - activeCount],
    ['Total inquiries (all codes)', totalInquiries],
    ['Total registrations (all codes)', totalRegistrations],
    ['Total paid to promoters (LKR)', totalPaidLKR.toFixed(2)],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 24 }]

  const codesData = [
    [
      'Code',
      'Promoter Name',
      'Address',
      'Phone',
      'ID Number',
      'Discount (LKR)',
      'Payment (LKR)',
      'Inquiries',
      'Registrations',
      'Total Paid (LKR)',
      'Status',
      'Created At',
      'Created By',
    ],
    ...codes.map((c) => [
      c.code,
      c.promoterName,
      c.promoterAddress,
      c.promoterPhone,
      c.promoterIdNumber,
      c.discountAmountLKR,
      c.paymentAmountLKR,
      c.totalInquiries,
      c.totalRegistrations,
      c.totalPaidLKR,
      c.isActive ? 'Active' : 'Inactive',
      new Date(c.createdAt).toLocaleString(),
      c.createdBy?.name ?? '',
    ]),
  ]

  const codesSheet = XLSX.utils.aoa_to_sheet(codesData)
  codesSheet['!cols'] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  XLSX.utils.book_append_sheet(workbook, codesSheet, 'Promotion Codes')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `promotion-codes-report-${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function exportToPDF(codes: PromotionCodeExport[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const totalInquiries = codes.reduce((s, c) => s + c.totalInquiries, 0)
  const totalRegistrations = codes.reduce((s, c) => s + c.totalRegistrations, 0)
  const totalPaidLKR = codes.reduce((s, c) => s + c.totalPaidLKR, 0)
  const activeCount = codes.filter((c) => c.isActive).length

  doc.setFontSize(20)
  doc.text('Promotion Codes Report', 14, 20)
  doc.setFontSize(12)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
  doc.text(`Total codes: ${codes.length} | Active: ${activeCount} | Inactive: ${codes.length - activeCount}`, 14, 35)
  doc.text(`Total inquiries: ${totalInquiries} | Total registrations: ${totalRegistrations} | Total paid (LKR): ${totalPaidLKR.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 42)

  const head = [
    'Code',
    'Promoter',
    'Phone',
    'Discount',
    'Payment',
    'Inq.',
    'Reg.',
    'Paid (LKR)',
    'Status',
  ]
  const body = codes.map((c) => [
    c.code,
    c.promoterName.length > 18 ? c.promoterName.slice(0, 17) + '…' : c.promoterName,
    c.promoterPhone,
    c.discountAmountLKR.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    c.paymentAmountLKR.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    String(c.totalInquiries),
    String(c.totalRegistrations),
    c.totalPaidLKR.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    c.isActive ? 'Active' : 'Inactive',
  ])

  autoTable(doc, {
    startY: 50,
    head: [head],
    body,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  })

  const internal = (doc as unknown as { internal: { getNumberOfPages: () => number; pageSize: { getHeight: () => number; getWidth: () => number } } }).internal
  const pageCount = internal.getNumberOfPages()
  const pageH = internal.pageSize.getHeight()
  const pageW = internal.pageSize.getWidth()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.text(
      `Page ${i} of ${pageCount} • Promotion Codes Report`,
      pageW - 14,
      pageH - 10,
      { align: 'right' }
    )
  }

  const buf = Buffer.from(doc.output('arraybuffer'))
  const filename = `promotion-codes-report-${new Date().toISOString().split('T')[0]}.pdf`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
