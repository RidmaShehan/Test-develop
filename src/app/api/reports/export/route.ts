import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Only ADMIN/ADMINISTRATOR/DEVELOPER can export reports
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month')
    const format = searchParams.get('format') || 'excel' // Changed default to excel

    // Build date range
    const startDate = new Date(year, month ? parseInt(month) - 1 : 0, 1)
    const endDate = new Date(year, month ? parseInt(month) : 12, 0, 23, 59, 59)

    // Get all activity logs for the period
    const activityLogs = await prisma.userActivityLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
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
        timestamp: 'asc'
      }
    })

    if (format === 'excel') {
      return exportToExcel(activityLogs, year, month)
    } else if (format === 'csv') {
      // Generate comprehensive CSV
      const csvContent = [
        // Header
        [
          'Timestamp',
          'Date',
          'Time',
          'User Name',
          'User Email',
          'User Role',
          'Activity Type',
          'IP Address',
          'Country',
          'City',
          'Region',
          'Browser',
          'OS',
          'Device',
          'Platform',
          'Status',
          'Failure Reason',
          'Session ID'
        ].join(','),
        
        // Data rows
        ...activityLogs.map(log => {
          const timestamp = new Date(log.timestamp)
          const date = timestamp.toLocaleDateString()
          const time = timestamp.toLocaleTimeString()
          
          // Safely parse JSON fields
          const location = log.location ? (typeof log.location === 'string' ? JSON.parse(log.location) : log.location) : null
          const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
          
          return [
            timestamp.toISOString(),
            `"${date}"`,
            `"${time}"`,
            `"${log.user.name}"`,
            `"${log.user.email}"`,
            `"${log.user.role}"`,
            log.activityType,
            log.ipAddress || '',
            location?.country || '',
            location?.city || '',
            location?.region || '',
            deviceInfo?.browser || '',
            deviceInfo?.os || '',
            deviceInfo?.device || '',
            deviceInfo?.platform || '',
            log.isSuccessful ? 'Success' : 'Failed',
            log.failureReason || '',
            log.sessionId || ''
          ].join(',')
        })
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="annual-report-${year}${month ? `-${month}` : ''}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // Generate comprehensive PDF with charts and tables
      const doc = new jsPDF()
      
      // Cover Page
      doc.setFontSize(24)
      doc.text('Education CRM', 20, 30)
      doc.setFontSize(18)
      doc.text('Annual Activity Report', 20, 45)
      
      doc.setFontSize(12)
      doc.text(`Report Period: ${year}${month ? ` - Month ${month}` : ''}`, 20, 60)
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 70)
      doc.text(`Total Records: ${activityLogs.length}`, 20, 80)
      
      // Executive Summary with Charts
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Executive Summary', 20, 20)
      
      const totalActivities = activityLogs.length
      const successfulActivities = activityLogs.filter(log => log.isSuccessful).length
      const failedActivities = activityLogs.filter(log => !log.isSuccessful).length
      const successRate = totalActivities > 0 ? ((successfulActivities / totalActivities) * 100).toFixed(1) : '0'
      
      // Summary Statistics Table
      autoTable(doc, {
        startY: 30,
        head: [['Metric', 'Count', 'Percentage']],
        body: [
          ['Total Activities', totalActivities.toString(), '100%'],
          ['Successful Activities', successfulActivities.toString(), `${successRate}%`],
          ['Failed Activities', failedActivities.toString(), `${(100 - parseFloat(successRate)).toFixed(1)}%`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // Activity breakdown by type
      const activityTypes = activityLogs.reduce((acc, log) => {
        acc[log.activityType] = (acc[log.activityType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      doc.setFontSize(14)
      doc.text('Activity Breakdown by Type', 20, 80)
      
      // Activity Types Table
      const activityTableData = Object.entries(activityTypes)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => [
          type,
          count.toString(),
          `${((count / totalActivities) * 100).toFixed(1)}%`
        ])
      
      autoTable(doc, {
        startY: 90,
        head: [['Activity Type', 'Count', 'Percentage']],
        body: activityTableData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // User Activity Analysis
      const userActivity = activityLogs.reduce((acc, log) => {
        const userId = log.user.id
        if (!acc[userId]) {
          acc[userId] = {
            name: log.user.name,
            email: log.user.email,
            role: log.user.role,
            count: 0,
            lastActivity: log.timestamp.toISOString()
          }
        }
        acc[userId].count++
        if (new Date(log.timestamp) > new Date(acc[userId].lastActivity)) {
          acc[userId].lastActivity = log.timestamp.toISOString()
        }
        return acc
      }, {} as Record<string, { name: string; email: string; role: string; count: number; lastActivity: string }>)
      
      const topUsers = Object.values(userActivity)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
      
      doc.addPage()
      doc.setFontSize(16)
      doc.text('User Activity Analysis', 20, 20)
      
      // Top Users Table
      const userTableData = topUsers.map((user, index) => [
        (index + 1).toString(),
        user.name,
        user.role,
        user.count.toString(),
        new Date(user.lastActivity).toLocaleDateString()
      ])
      
      autoTable(doc, {
        startY: 30,
        head: [['Rank', 'User Name', 'Role', 'Activities', 'Last Activity']],
        body: userTableData,
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // Role-based Activity Analysis
      const roleActivity = activityLogs.reduce((acc, log) => {
        const role = log.user.role
        if (!acc[role]) {
          acc[role] = { count: 0, users: new Set() }
        }
        acc[role].count++
        acc[role].users.add(log.user.id)
        return acc
      }, {} as Record<string, { count: number; users: Set<string> }>)
      
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Role-based Activity Analysis', 20, 20)
      
      const roleTableData = Object.entries(roleActivity)
        .sort(([,a], [,b]) => b.count - a.count)
        .map(([role, data]) => [
          role,
          data.count.toString(),
          `${((data.count / totalActivities) * 100).toFixed(1)}%`,
          data.users.size.toString()
        ])
      
      autoTable(doc, {
        startY: 30,
        head: [['Role', 'Activities', 'Percentage', 'Unique Users']],
        body: roleTableData,
        theme: 'striped',
        headStyles: { fillColor: [230, 126, 34] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // Geographic Analysis
      const locationData = activityLogs.reduce((acc, log) => {
        const location = log.location ? (typeof log.location === 'string' ? JSON.parse(log.location) : log.location) : null
        const country = location?.country || 'Unknown'
        if (!acc[country]) {
          acc[country] = { count: 0, cities: new Set() }
        }
        acc[country].count++
        if (location?.city) {
          acc[country].cities.add(location.city)
        }
        return acc
      }, {} as Record<string, { count: number; cities: Set<string> }>)
      
      if (Object.keys(locationData).length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text('Geographic Activity Analysis', 20, 20)
        
        const locationTableData = Object.entries(locationData)
          .sort(([,a], [,b]) => b.count - a.count)
          .map(([country, data]) => [
            country,
            data.count.toString(),
            `${((data.count / totalActivities) * 100).toFixed(1)}%`,
            data.cities.size.toString()
          ])
        
        autoTable(doc, {
          startY: 30,
          head: [['Country', 'Activities', 'Percentage', 'Cities']],
          body: locationTableData,
          theme: 'grid',
          headStyles: { fillColor: [52, 152, 219] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        })
      }
      
      // Device and Browser Analysis
      const deviceData = activityLogs.reduce((acc, log) => {
        const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
        const browser = deviceInfo?.browser || 'Unknown'
        const os = deviceInfo?.os || 'Unknown'
        const device = deviceInfo?.device || 'Unknown'
        
        if (!acc.browsers[browser]) acc.browsers[browser] = 0
        if (!acc.os[os]) acc.os[os] = 0
        if (!acc.devices[device]) acc.devices[device] = 0
        
        acc.browsers[browser]++
        acc.os[os]++
        acc.devices[device]++
        
        return acc
      }, { browsers: {} as Record<string, number>, os: {} as Record<string, number>, devices: {} as Record<string, number> })
      
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Technology Usage Analysis', 20, 20)
      
      // Browser Analysis Table
      const browserTableData = Object.entries(deviceData.browsers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([browser, count]) => [
          browser,
          count.toString(),
          `${((count / totalActivities) * 100).toFixed(1)}%`
        ])
      
      autoTable(doc, {
        startY: 30,
        head: [['Browser', 'Count', 'Percentage']],
        body: browserTableData,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // OS Analysis Table
      const osTableData = Object.entries(deviceData.os)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([os, count]) => [
          os,
          count.toString(),
          `${((count / totalActivities) * 100).toFixed(1)}%`
        ])
      
      autoTable(doc, {
        startY: 120,
        head: [['Operating System', 'Count', 'Percentage']],
        body: osTableData,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // Time-based Analysis
      const hourlyActivity = activityLogs.reduce((acc, log) => {
        const hour = new Date(log.timestamp).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {} as Record<number, number>)
      
      doc.addPage()
      doc.setFontSize(16)
      doc.text('Time-based Activity Analysis', 20, 20)
      
      // Hourly Activity Table
      const hourlyTableData = []
      for (let hour = 0; hour < 24; hour++) {
        const count = hourlyActivity[hour] || 0
        const percentage = totalActivities > 0 ? ((count / totalActivities) * 100).toFixed(1) : '0'
        hourlyTableData.push([
          `${hour.toString().padStart(2, '0')}:00`,
          count.toString(),
          `${percentage}%`
        ])
      }
      
      autoTable(doc, {
        startY: 30,
        head: [['Hour', 'Activities', 'Percentage']],
        body: hourlyTableData,
        theme: 'striped',
        headStyles: { fillColor: [142, 68, 173] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
      
      // Recent Activities Detail
      if (activityLogs.length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.text('Recent Activities Detail', 20, 20)
        
        const recentLogs = activityLogs.slice(-100) // Last 100 activities
        const recentTableData = recentLogs.map(log => {
          const location = log.location ? (typeof log.location === 'string' ? JSON.parse(log.location) : log.location) : null
          const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
          return [
            new Date(log.timestamp).toLocaleString(),
            log.user.name,
            log.user.role,
            log.activityType,
            log.isSuccessful ? 'Success' : 'Failed',
            location?.country || 'Unknown',
            deviceInfo?.browser || 'Unknown'
          ]
        })
        
        autoTable(doc, {
          startY: 30,
          head: [['Timestamp', 'User', 'Role', 'Activity', 'Status', 'Country', 'Browser']],
          body: recentTableData,
          theme: 'grid',
          headStyles: { fillColor: [44, 62, 80] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          styles: { fontSize: 8 }
        })
      }
      
      // Footer
      doc.setFontSize(8)
      doc.text('Generated by Education CRM System', 20, 290)
      doc.text(`Page ${doc.getNumberOfPages()}`, 180, 290)
      
      // Generate PDF buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="annual-report-${year}${month ? `-${month}` : ''}.pdf"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported format. Use "excel", "csv", or "pdf"' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Excel Export Function
function exportToExcel(activityLogs: any[], year: number, month: string | null) {
  // Prepare main data sheet
  const mainData = activityLogs.map(log => {
    const location = log.location ? (typeof log.location === 'string' ? JSON.parse(log.location) : log.location) : null
    const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
    
    return {
      'Timestamp': new Date(log.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      'Date': new Date(log.timestamp).toLocaleDateString(),
      'Time': new Date(log.timestamp).toLocaleTimeString(),
      'User Name': log.user.name,
      'User Email': log.user.email,
      'User Role': log.user.role,
      'Activity Type': log.activityType,
      'Status': log.isSuccessful ? 'Success' : 'Failed',
      'IP Address': log.ipAddress || 'N/A',
      'Country': location?.country || 'N/A',
      'City': location?.city || 'N/A',
      'Region': location?.region || 'N/A',
      'Browser': deviceInfo?.browser || 'N/A',
      'Operating System': deviceInfo?.os || 'N/A',
      'Device': deviceInfo?.device || 'N/A',
      'Platform': deviceInfo?.platform || 'N/A',
      'Session ID': log.sessionId || 'N/A',
      'Failure Reason': log.failureReason || 'N/A'
    }
  })

  // Calculate summary statistics
  const totalActivities = activityLogs.length
  const loginLogs = activityLogs.filter(log => log.activityType === 'LOGIN' && log.isSuccessful)
  const logoutLogs = activityLogs.filter(log => log.activityType === 'LOGOUT')
  const uniqueUsers = new Set(loginLogs.map(log => log.userId)).size
  
  // Summary data
  const summaryData = [
    { 'Metric': 'Report Period', 'Value': `${year}${month ? ` - Month ${month}` : ' (Full Year)'}` },
    { 'Metric': 'Generated On', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Total Activities', 'Value': totalActivities },
    { 'Metric': 'Total Logins', 'Value': loginLogs.length },
    { 'Metric': 'Total Logouts', 'Value': logoutLogs.length },
    { 'Metric': 'Unique Users', 'Value': uniqueUsers },
    { 'Metric': 'Success Rate', 'Value': `${((activityLogs.filter(l => l.isSuccessful).length / totalActivities) * 100).toFixed(1)}%` }
  ]

  // User activity summary
  const userActivity = activityLogs.reduce((acc, log) => {
    const userId = log.user.id
    if (!acc[userId]) {
      acc[userId] = {
        'User Name': log.user.name,
        'Email': log.user.email,
        'Role': log.user.role,
        'Total Activities': 0,
        'Logins': 0,
        'Logouts': 0,
        'Last Activity': log.timestamp
      }
    }
    acc[userId]['Total Activities']++
    if (log.activityType === 'LOGIN') acc[userId]['Logins']++
    if (log.activityType === 'LOGOUT') acc[userId]['Logouts']++
    if (new Date(log.timestamp) > new Date(acc[userId]['Last Activity'])) {
      acc[userId]['Last Activity'] = log.timestamp
    }
    return acc
  }, {} as Record<string, any>)

  const userSummaryData = Object.values(userActivity).map((user: any) => ({
    ...user,
    'Last Activity': new Date(user['Last Activity']).toLocaleString()
  }))

  // Geographic summary
  const locationData = activityLogs.reduce((acc, log) => {
    const location = log.location ? (typeof log.location === 'string' ? JSON.parse(log.location) : log.location) : null
    const country = location?.country || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const geoData = Object.entries(locationData)
    .map(([country, count]) => ({
      'Country': country,
      'Activities': count as number,
      'Percentage': `${(((count as number) / totalActivities) * 100).toFixed(1)}%`
    }))
    .sort((a, b) => b.Activities - a.Activities)

  // Technology summary
  const deviceData = activityLogs.reduce((acc, log) => {
    const deviceInfo = log.deviceInfo ? (typeof log.deviceInfo === 'string' ? JSON.parse(log.deviceInfo) : log.deviceInfo) : null
    const browser = deviceInfo?.browser || 'Unknown'
    const os = deviceInfo?.os || 'Unknown'
    const device = deviceInfo?.device || 'Unknown'
    
    if (!acc.browsers[browser]) acc.browsers[browser] = 0
    if (!acc.os[os]) acc.os[os] = 0
    if (!acc.devices[device]) acc.devices[device] = 0
    
    acc.browsers[browser]++
    acc.os[os]++
    acc.devices[device]++
    
    return acc
  }, { browsers: {} as Record<string, number>, os: {} as Record<string, number>, devices: {} as Record<string, number> })

  const browserData = Object.entries(deviceData.browsers)
    .map(([browser, count]) => ({
      'Browser': browser,
      'Count': count as number,
      'Percentage': `${(((count as number) / totalActivities) * 100).toFixed(1)}%`
    }))
    .sort((a, b) => b.Count - a.Count)

  const osData = Object.entries(deviceData.os)
    .map(([os, count]) => ({
      'Operating System': os,
      'Count': count as number,
      'Percentage': `${(((count as number) / totalActivities) * 100).toFixed(1)}%`
    }))
    .sort((a, b) => b.Count - a.Count)

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Add Summary sheet
  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Add All Activities sheet
  const activitiesSheet = XLSX.utils.json_to_sheet(mainData)
  XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'All Activities')

  // Add User Summary sheet
  const userSheet = XLSX.utils.json_to_sheet(userSummaryData)
  XLSX.utils.book_append_sheet(workbook, userSheet, 'User Summary')

  // Add Geographic Analysis sheet
  const geoSheet = XLSX.utils.json_to_sheet(geoData)
  XLSX.utils.book_append_sheet(workbook, geoSheet, 'Geographic Analysis')

  // Add Browser Analysis sheet
  const browserSheet = XLSX.utils.json_to_sheet(browserData)
  XLSX.utils.book_append_sheet(workbook, browserSheet, 'Browsers')

  // Add OS Analysis sheet
  const osSheet = XLSX.utils.json_to_sheet(osData)
  XLSX.utils.book_append_sheet(workbook, osSheet, 'Operating Systems')

  // Set column widths for better readability
  const setColumnWidths = (sheet: any, widths: number[]) => {
    sheet['!cols'] = widths.map(w => ({ wch: w }))
  }

  setColumnWidths(summarySheet, [25, 40])
  setColumnWidths(activitiesSheet, [20, 12, 12, 20, 30, 15, 18, 10, 15, 15, 15, 15, 20, 20, 15, 15, 30, 30])
  setColumnWidths(userSheet, [20, 30, 15, 18, 10, 10, 20])
  setColumnWidths(geoSheet, [20, 15, 12])
  setColumnWidths(browserSheet, [20, 10, 12])
  setColumnWidths(osSheet, [25, 10, 12])

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  const filename = `annual-report-${year}${month ? `-${month}` : ''}.xlsx`
  
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
