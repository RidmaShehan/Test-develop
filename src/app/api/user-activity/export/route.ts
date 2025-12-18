import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only ADMIN/ADMINISTRATOR/DEVELOPER can export activity logs
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel' // excel or pdf
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const activityType = searchParams.get('activityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isSuccessful = searchParams.get('isSuccessful')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }

    if (role) {
      where.user = { ...(where.user || {}), role }
    }
    
    if (activityType) {
      where.activityType = activityType
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }
    
    if (isSuccessful !== null && isSuccessful !== undefined && isSuccessful !== '') {
      where.isSuccessful = isSuccessful === 'true'
    }

    if (search) {
      const q = search.trim()
      if (q) {
        where.OR = [
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { ipAddress: { contains: q } },
        ]
      }
    }

    // Fetch activity logs (limit to 10000 for export)
    const activityLogs = await prisma.userActivityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10000
    })

    if (format === 'excel') {
      return exportToExcel(activityLogs)
    } else if (format === 'pdf') {
      return exportToPDF(activityLogs)
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "excel" or "pdf"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error exporting activity logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function exportToExcel(activityLogs: any[]) {
  // Prepare data for Excel
  const data = activityLogs.map(log => ({
    'Timestamp': new Date(log.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    'User Name': log.user.name,
    'Email': log.user.email,
    'Role': log.user.role,
    'Activity Type': log.activityType,
    'Status': log.isSuccessful ? 'Success' : 'Failed',
    'IP Address': log.ipAddress || 'N/A',
    'Country': log.location?.country || 'N/A',
    'City': log.location?.city || 'N/A',
    'Browser': log.deviceInfo?.browser || 'N/A',
    'OS': log.deviceInfo?.os || 'N/A',
    'Device': log.deviceInfo?.device || 'N/A',
    'Session ID': log.sessionId || 'N/A',
    'Failure Reason': log.failureReason || 'N/A'
  }))

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs')

  // Set column widths
  const maxWidth = 30
  worksheet['!cols'] = [
    { wch: 20 }, // Timestamp
    { wch: 20 }, // User Name
    { wch: 25 }, // Email
    { wch: 15 }, // Role
    { wch: 18 }, // Activity Type
    { wch: 10 }, // Status
    { wch: 15 }, // IP Address
    { wch: 15 }, // Country
    { wch: 15 }, // City
    { wch: 15 }, // Browser
    { wch: 15 }, // OS
    { wch: 15 }, // Device
    { wch: 25 }, // Session ID
    { wch: 30 }  // Failure Reason
  ]

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  const filename = `activity-logs-${new Date().toISOString().split('T')[0]}.xlsx`
  
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

function exportToPDF(activityLogs: any[]) {
  const doc = new jsPDF('landscape')
  
  // Add title
  doc.setFontSize(18)
  doc.text('User Activity Logs Report', 14, 15)
  
  // Add generation date
  doc.setFontSize(10)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22)
  doc.text(`Total Records: ${activityLogs.length}`, 14, 27)
  
  // Prepare table data
  const tableData = activityLogs.map(log => [
    new Date(log.timestamp).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    log.user.name,
    log.user.email,
    log.user.role,
    log.activityType,
    log.isSuccessful ? 'Success' : 'Failed',
    log.ipAddress || 'N/A',
    log.location?.city && log.location?.country 
      ? `${log.location.city}, ${log.location.country}`
      : 'N/A',
    log.deviceInfo?.browser || 'N/A'
  ])
  
  // Add table
  autoTable(doc, {
    head: [['Timestamp', 'User', 'Email', 'Role', 'Activity', 'Status', 'IP Address', 'Location', 'Browser']],
    body: tableData,
    startY: 32,
    styles: { 
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 28 },  // Timestamp
      1: { cellWidth: 25 },  // User
      2: { cellWidth: 40 },  // Email
      3: { cellWidth: 20 },  // Role
      4: { cellWidth: 25 },  // Activity
      5: { cellWidth: 18 },  // Status
      6: { cellWidth: 25 },  // IP
      7: { cellWidth: 30 },  // Location
      8: { cellWidth: 25 }   // Browser
    },
    margin: { top: 32, left: 14, right: 14 }
  })
  
  // Add page numbers
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 30,
      doc.internal.pageSize.getHeight() - 10
    )
  }
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  const filename = `activity-logs-${new Date().toISOString().split('T')[0]}.pdf`
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

