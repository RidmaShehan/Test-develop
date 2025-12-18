import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { SeekerStage } from '@prisma/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const _user = await requireAuth(request)
    const isAdmin = isAdminRole(_user.role)
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    
    // Build where clause based on user role
    const seekerWhere: any = {}
    const interactionWhere: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own data
    if (!isAdmin) {
      seekerWhere.createdById = _user.id
      interactionWhere.userId = _user.id
    }
    
    // ============================================
    // 1. GET TOTAL INQUIRIES COUNT (Same as inquiries page)
    // ============================================
    const totalInquiries = await prisma.seeker.count({ where: seekerWhere })
    
    // ============================================
    // 2. GET SOURCE PERFORMANCE DATA
    // ============================================
    const sourceData = await prisma.seeker.groupBy({
      by: ['marketingSource'],
      where: seekerWhere,
      _count: {
        id: true,
      },
    })

    // ============================================
    // 3. GET STAGE DISTRIBUTION
    // ============================================
    const stageData = await prisma.seeker.groupBy({
      by: ['stage'],
      where: seekerWhere,
      _count: {
        id: true,
      },
    })

    // Verify total from stage distribution matches totalInquiries
    const stageTotal = stageData.reduce((sum, item) => sum + item._count.id, 0)
    
    // ============================================
    // 4. CALCULATE CONVERSIONS
    // ============================================
    // Converted stages: QUALIFIED, COUNSELING_SCHEDULED, READY_TO_REGISTER
    // These represent inquiries that have progressed positively in the pipeline
    const convertedStages: SeekerStage[] = [
      SeekerStage.QUALIFIED,
      SeekerStage.COUNSELING_SCHEDULED,
      SeekerStage.READY_TO_REGISTER,
    ]
    const convertedCount = stageData
      .filter(s => convertedStages.includes(s.stage))
      .reduce((sum, item) => sum + item._count.id, 0)

    // ============================================
    // 5. CALCULATE CONVERSION RATES PER SOURCE
    // ============================================
    const sourceConversions: Record<string, number> = {}
    for (const source of sourceData) {
      const convertedFromSource = await prisma.seeker.count({
        where: {
          ...seekerWhere,
          marketingSource: source.marketingSource,
          stage: {
            in: convertedStages
          }
        }
      })
      sourceConversions[source.marketingSource] = source._count.id > 0 
        ? Math.round((convertedFromSource / source._count.id) * 100) 
        : 0
    }

    const sourcePerformance = sourceData
      .filter(source => source.marketingSource) // Filter out null/undefined sources
      .map(source => ({
        source: source.marketingSource.replace(/_/g, ' '),
        count: source._count.id,
        conversionRate: sourceConversions[source.marketingSource] || 0,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending

    const stageDistribution = stageData.map(stage => ({
      stage: stage.stage.replace(/_/g, ' '),
      count: stage._count.id,
    })).sort((a, b) => b.count - a.count) // Sort by count descending

    // ============================================
    // 6. GET REAL MONTHLY TRENDS (Last 6 months)
    // ============================================
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    
    const monthlyData = await prisma.seeker.findMany({
      where: {
        ...seekerWhere,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        id: true,
        createdAt: true,
        stage: true
      }
    })

    // Group by month
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyTrends: Array<{ month: string; monthYear: string; newSeekers: number; conversions: number }> = []
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      
      const monthSeekers = monthlyData.filter(s => {
        const created = new Date(s.createdAt)
        return created >= monthDate && created <= monthEnd
      })
      
      const conversions = monthSeekers.filter(s => 
        convertedStages.includes(s.stage)
      ).length
      
      monthlyTrends.push({
        month: monthNames[monthDate.getMonth()],
        monthYear: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
        newSeekers: monthSeekers.length,
        conversions: conversions
      })
    }

    // ============================================
    // 7. GET INTERACTION METRICS
    // ============================================
    const totalInteractions = await prisma.interaction.count({ where: interactionWhere })
    
    // Connected interactions (successful contacts)
    const connectedInteractions = await prisma.interaction.count({
      where: {
        ...interactionWhere,
        outcome: {
          in: ['CONNECTED_INTERESTED', 'APPOINTMENT_BOOKED']
        }
      },
    })
    
    // Appointment booked interactions
    const appointmentInteractions = await prisma.interaction.count({
      where: {
        ...interactionWhere,
        outcome: 'APPOINTMENT_BOOKED',
      },
    })
    
    // Get interaction breakdown by outcome
    const interactionOutcomes = await prisma.interaction.groupBy({
      by: ['outcome'],
      where: interactionWhere,
      _count: {
        id: true
      }
    })

    // ============================================
    // 8. GET ADDITIONAL METRICS
    // ============================================
    // New inquiries this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const newThisMonth = await prisma.seeker.count({
      where: {
        ...seekerWhere,
        createdAt: {
          gte: thisMonthStart
        }
      }
    })
    
    // Lost inquiries count
    const lostCount = stageData.find(s => s.stage === 'LOST')?._count.id || 0
    
    // Ready to register count
    const readyToRegisterCount = stageData.find(s => s.stage === 'READY_TO_REGISTER')?._count.id || 0

    // ============================================
    // 9. GET USER-WISE PERFORMANCE DATA
    // ============================================
    // Get all active users with their performance metrics
    const allUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        // If not admin, only show current user
        ...(isAdmin ? {} : { id: _user.id })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get inquiries grouped by user
    const inquiriesByUser = await prisma.seeker.groupBy({
      by: ['createdById'],
      where: {
        createdById: { not: null }
      },
      _count: {
        id: true
      }
    })

    // Get converted inquiries grouped by user
    const convertedByUser = await prisma.seeker.groupBy({
      by: ['createdById'],
      where: {
        createdById: { not: null },
        stage: {
          in: convertedStages
        }
      },
      _count: {
        id: true
      }
    })

    // Get interactions grouped by user
    const interactionsByUser = await prisma.interaction.groupBy({
      by: ['userId'],
      _count: {
        id: true
      }
    })

    // Get this month's inquiries grouped by user
    const thisMonthByUser = await prisma.seeker.groupBy({
      by: ['createdById'],
      where: {
        createdById: { not: null },
        createdAt: {
          gte: thisMonthStart
        }
      },
      _count: {
        id: true
      }
    })

    // Build user performance array
    const userPerformance = allUsers.map(user => {
      const inquiryCount = inquiriesByUser.find(i => i.createdById === user.id)?._count.id || 0
      const convertedCount = convertedByUser.find(c => c.createdById === user.id)?._count.id || 0
      const interactionCount = interactionsByUser.find(i => i.userId === user.id)?._count.id || 0
      const thisMonthCount = thisMonthByUser.find(t => t.createdById === user.id)?._count.id || 0
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.replace(/_/g, ' '),
        inquiries: inquiryCount,
        converted: convertedCount,
        conversionRate: inquiryCount > 0 ? Math.round((convertedCount / inquiryCount) * 100) : 0,
        interactions: interactionCount,
        thisMonth: thisMonthCount,
        joinedAt: user.createdAt
      }
    }).sort((a, b) => b.inquiries - a.inquiries) // Sort by inquiries descending

    // ============================================
    // 10. CALCULATE FINAL METRICS
    // ============================================
    const contactMetrics = {
      totalCalls: totalInteractions,
      // Contact rate = (connected interactions / total interactions) * 100
      contactRate: totalInteractions > 0 ? Math.round((connectedInteractions / totalInteractions) * 100) : 0,
      // Appointment rate = (appointments / total interactions) * 100
      appointmentRate: totalInteractions > 0 ? Math.round((appointmentInteractions / totalInteractions) * 100) : 0,
      // Conversion rate = (converted inquiries / total inquiries) * 100
      conversionRate: totalInquiries > 0 ? Math.round((convertedCount / totalInquiries) * 100) : 0,
    }

    const reportData = {
      // Main counts
      totalSeekers: totalInquiries, // Use the verified count
      convertedSeekers: convertedCount,
      lostSeekers: lostCount,
      readyToRegister: readyToRegisterCount,
      newThisMonth: newThisMonth,
      
      // Distributions
      sourcePerformance,
      stageDistribution,
      monthlyTrends,
      
      // Metrics
      contactMetrics,
      
      // User-wise performance
      userPerformance,
      
      // Interaction breakdown
      interactionBreakdown: interactionOutcomes.map(o => ({
        outcome: o.outcome.replace(/_/g, ' '),
        count: o._count.id
      })),
      
      // Debug info (remove in production)
      _debug: {
        totalFromStages: stageTotal,
        totalFromCount: totalInquiries,
        isConsistent: stageTotal === totalInquiries,
        user: _user.email,
        isAdmin: isAdmin
      }
    }

    // If format is PDF, generate and return PDF
    if (format === 'pdf') {
      return generatePDFReport(reportData, _user.name)
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error fetching report data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    )
  }
}

function generatePDFReport(data: any, userName: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // ========== COVER PAGE ==========
  // Background gradient effect (blue header)
  doc.setFillColor(59, 130, 246) // Blue
  doc.rect(0, 0, pageWidth, 80, 'F')
  
  // Logo placeholder
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(20, 15, 50, 50, 5, 5, 'F')
  doc.setTextColor(59, 130, 246)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CRM', 30, 45)
  
  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.text('Analytics Report', 85, 40)
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Performance & Insights Dashboard', 85, 55)
  
  // Report info box
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(20, 100, pageWidth - 40, 80, 5, 5, 'F')
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Report Details', 30, 115)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 30, 130)
  doc.text(`Generated by: ${userName}`, 30, 145)
  doc.text(`Total Inquiries: ${data.totalSeekers}`, 30, 160)
  doc.text(`Overall Conversion Rate: ${data.contactMetrics.conversionRate}%`, 120, 160)
  
  // Quick stats boxes
  const statsY = 200
  const boxWidth = (pageWidth - 50) / 4
  
  const stats = [
    { label: 'Total Inquiries', value: data.totalSeekers.toString(), color: [59, 130, 246] },
    { label: 'Converted', value: data.convertedSeekers.toString(), color: [16, 185, 129] },
    { label: 'New This Month', value: data.newThisMonth.toString(), color: [245, 158, 11] },
    { label: 'Conversion Rate', value: `${data.contactMetrics.conversionRate}%`, color: [139, 92, 246] },
  ]
  
  stats.forEach((stat, index) => {
    const x = 20 + (index * (boxWidth + 5))
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
    doc.roundedRect(x, statsY, boxWidth, 45, 3, 3, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(stat.value, x + 10, statsY + 25)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(stat.label, x + 10, statsY + 38)
  })
  
  // Footer
  doc.setTextColor(128, 128, 128)
  doc.setFontSize(8)
  doc.text('Education CRM System - Confidential Report', 20, pageHeight - 15)
  doc.text('Page 1', pageWidth - 30, pageHeight - 15)
  
  // ========== PAGE 2: SOURCE PERFORMANCE ==========
  doc.addPage()
  
  // Header
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Source Performance Analysis', 20, 17)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Breakdown of inquiries by marketing source with conversion rates', 20, 40)
  
  // Source Performance Table
  const sourceTableData = data.sourcePerformance.map((source: any, index: number) => [
    (index + 1).toString(),
    source.source,
    source.count.toString(),
    `${source.conversionRate}%`,
    source.conversionRate >= 30 ? 'High' : source.conversionRate >= 15 ? 'Medium' : 'Low'
  ])
  
  if (sourceTableData.length > 0) {
    autoTable(doc, {
      startY: 50,
      head: [['#', 'Marketing Source', 'Inquiries', 'Conversion Rate', 'Performance']],
      body: sourceTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 30 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10 },
      didParseCell: function(cellData: any) {
        if (cellData.column.index === 4 && cellData.section === 'body') {
          if (cellData.cell.raw === 'High') {
            cellData.cell.styles.textColor = [16, 185, 129]
            cellData.cell.styles.fontStyle = 'bold'
          } else if (cellData.cell.raw === 'Medium') {
            cellData.cell.styles.textColor = [245, 158, 11]
          } else {
            cellData.cell.styles.textColor = [239, 68, 68]
          }
        }
      }
    })
    
    // Summary box
    const summaryY = (doc as any).lastAutoTable.finalY + 20
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(20, summaryY, pageWidth - 40, 40, 3, 3, 'F')
    doc.setDrawColor(16, 185, 129)
    doc.roundedRect(20, summaryY, pageWidth - 40, 40, 3, 3, 'S')
    
    doc.setTextColor(16, 185, 129)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 30, summaryY + 15)
    
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const topSource = data.sourcePerformance[0]
    doc.text(`Top Source: ${topSource?.source || 'N/A'} with ${topSource?.count || 0} inquiries`, 30, summaryY + 30)
    doc.text(`Total Sources: ${data.sourcePerformance.length}`, 130, summaryY + 30)
  } else {
    doc.text('No source data available', 20, 60)
  }
  
  // Footer
  doc.setTextColor(128, 128, 128)
  doc.setFontSize(8)
  doc.text('Education CRM System - Confidential Report', 20, pageHeight - 15)
  doc.text('Page 2', pageWidth - 30, pageHeight - 15)
  
  // ========== PAGE 3: PIPELINE STAGES ==========
  doc.addPage()
  
  // Header
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Pipeline Stage Distribution', 20, 17)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Current distribution of ${data.totalSeekers} inquiries across pipeline stages`, 20, 40)
  
  // Stage Distribution Table
  const totalInPipeline = data.stageDistribution.reduce((sum: number, s: any) => sum + s.count, 0)
  const stageTableData = data.stageDistribution.map((stage: any, index: number) => [
    (index + 1).toString(),
    stage.stage,
    stage.count.toString(),
    `${totalInPipeline > 0 ? ((stage.count / totalInPipeline) * 100).toFixed(1) : 0}%`
  ])
  
  if (stageTableData.length > 0) {
    autoTable(doc, {
      startY: 50,
      head: [['#', 'Pipeline Stage', 'Count', 'Percentage']],
      body: stageTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 40 },
        3: { halign: 'center', cellWidth: 35 }
      },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 10 }
    })
    
    // Funnel visualization
    const funnelY = (doc as any).lastAutoTable.finalY + 30
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Pipeline Funnel', 20, funnelY)
    
    const stages = data.stageDistribution
    const maxCount = stages[0]?.count || 1
    const funnelColors = [
      [59, 130, 246], [16, 185, 129], [245, 158, 11], [139, 92, 246],
      [236, 72, 153], [6, 182, 212], [132, 204, 22], [239, 68, 68]
    ]
    
    stages.slice(0, 6).forEach((stage: any, index: number) => {
      const barWidth = Math.max(((stage.count / maxCount) * 140) + 30, 50)
      const y = funnelY + 15 + (index * 18)
      const color = funnelColors[index % funnelColors.length]
      
      doc.setFillColor(color[0], color[1], color[2])
      doc.roundedRect(20, y, barWidth, 14, 2, 2, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${stage.stage}: ${stage.count}`, 25, y + 10)
    })
  }
  
  // Footer
  doc.setTextColor(128, 128, 128)
  doc.setFontSize(8)
  doc.text('Education CRM System - Confidential Report', 20, pageHeight - 15)
  doc.text('Page 3', pageWidth - 30, pageHeight - 15)
  
  // ========== PAGE 4: MONTHLY TRENDS ==========
  doc.addPage()
  
  // Header
  doc.setFillColor(139, 92, 246)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Monthly Trends Analysis', 20, 17)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('6-month performance trend showing new inquiries and conversions', 20, 40)
  
  // Monthly Trends Table
  const monthlyTableData = data.monthlyTrends.map((month: any) => [
    month.monthYear || month.month,
    month.newSeekers.toString(),
    month.conversions.toString(),
    month.newSeekers > 0 ? `${((month.conversions / month.newSeekers) * 100).toFixed(1)}%` : '0%'
  ])
  
  autoTable(doc, {
    startY: 50,
    head: [['Month', 'New Inquiries', 'Conversions', 'Conversion Rate']],
    body: monthlyTableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [139, 92, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 40 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'center', cellWidth: 40 }
    },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    styles: { fontSize: 10 }
  })
  
  // Bar chart visualization
  const chartY = (doc as any).lastAutoTable.finalY + 25
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Visual Trend', 20, chartY)
  
  const maxMonthly = Math.max(...data.monthlyTrends.map((m: any) => m.newSeekers), 1)
  const barBaseY = chartY + 80
  const barSpacing = 25
  
  data.monthlyTrends.forEach((month: any, index: number) => {
    const x = 30 + (index * barSpacing)
    const barHeight = (month.newSeekers / maxMonthly) * 50
    const convBarHeight = (month.conversions / maxMonthly) * 50
    
    // Inquiries bar (blue)
    doc.setFillColor(59, 130, 246)
    if (barHeight > 0) {
      doc.rect(x, barBaseY - barHeight, 10, barHeight, 'F')
    }
    
    // Conversions bar (green)
    doc.setFillColor(16, 185, 129)
    if (convBarHeight > 0) {
      doc.rect(x + 11, barBaseY - convBarHeight, 10, convBarHeight, 'F')
    }
    
    // Month label
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.text(month.month, x + 3, barBaseY + 10)
  })
  
  // Legend
  doc.setFillColor(59, 130, 246)
  doc.rect(30, barBaseY + 20, 10, 8, 'F')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)
  doc.text('New Inquiries', 45, barBaseY + 26)
  
  doc.setFillColor(16, 185, 129)
  doc.rect(100, barBaseY + 20, 10, 8, 'F')
  doc.text('Conversions', 115, barBaseY + 26)
  
  // Totals summary
  const totalNewInquiries = data.monthlyTrends.reduce((sum: number, m: any) => sum + m.newSeekers, 0)
  const totalConversions = data.monthlyTrends.reduce((sum: number, m: any) => sum + m.conversions, 0)
  const avgMonthly = Math.round(totalNewInquiries / Math.max(data.monthlyTrends.length, 1))
  
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(20, barBaseY + 40, pageWidth - 40, 35, 3, 3, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Period Summary (Last 6 Months)', 30, barBaseY + 55)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Inquiries: ${totalNewInquiries}`, 30, barBaseY + 68)
  doc.text(`Total Conversions: ${totalConversions}`, 90, barBaseY + 68)
  doc.text(`Avg Monthly: ${avgMonthly}`, 160, barBaseY + 68)
  
  // Footer
  doc.setTextColor(128, 128, 128)
  doc.setFontSize(8)
  doc.text('Education CRM System - Confidential Report', 20, pageHeight - 15)
  doc.text('Page 4', pageWidth - 30, pageHeight - 15)
  
  // ========== PAGE 5: SUMMARY & RECOMMENDATIONS ==========
  doc.addPage()
  
  // Header
  doc.setFillColor(245, 158, 11)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary & Key Insights', 20, 17)
  
  doc.setTextColor(0, 0, 0)
  
  // Key metrics summary
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Performance Overview', 20, 45)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const insights = [
    `• Total Inquiries in System: ${data.totalSeekers}`,
    `• Total Converted: ${data.convertedSeekers} (${data.contactMetrics.conversionRate}%)`,
    `• New Inquiries This Month: ${data.newThisMonth}`,
    `• Ready to Register: ${data.readyToRegister}`,
    `• Lost Inquiries: ${data.lostSeekers}`,
    `• Total Interactions Logged: ${data.contactMetrics.totalCalls}`,
    `• Contact Success Rate: ${data.contactMetrics.contactRate}%`,
    `• Appointment Booking Rate: ${data.contactMetrics.appointmentRate}%`,
    `• Number of Marketing Sources: ${data.sourcePerformance.length}`,
    `• Active Pipeline Stages: ${data.stageDistribution.length}`
  ]
  
  let yPos = 60
  insights.forEach(insight => {
    doc.text(insight, 25, yPos)
    yPos += 12
  })
  
  // Recommendations
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Recommendations', 20, yPos + 15)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const recommendations = []
  
  if (data.contactMetrics.contactRate < 50) {
    recommendations.push('• Contact rate is below 50%. Consider improving outreach timing and methods.')
  }
  if (data.contactMetrics.conversionRate < 20) {
    recommendations.push('• Conversion rate could be improved. Review qualification criteria and follow-up processes.')
  }
  const lowPerformingSources = data.sourcePerformance.filter((s: any) => s.conversionRate < 10)
  if (lowPerformingSources.length > 0) {
    recommendations.push(`• ${lowPerformingSources.length} source(s) have conversion rates below 10%. Consider reallocating budget.`)
  }
  if (data.lostSeekers > data.convertedSeekers) {
    recommendations.push('• Lost inquiries exceed conversions. Review the sales process for improvement areas.')
  }
  if (recommendations.length === 0) {
    recommendations.push('• Performance metrics are healthy. Continue current strategies.')
    recommendations.push('• Consider A/B testing to further optimize conversion rates.')
  }
  recommendations.push('• Regularly review and update pipeline stages to reflect actual journey.')
  recommendations.push('• Ensure all team members are logging interactions consistently.')
  
  yPos += 30
  recommendations.forEach(rec => {
    doc.text(rec, 25, yPos)
    yPos += 12
  })
  
  // Signature area
  doc.setDrawColor(200, 200, 200)
  doc.line(20, pageHeight - 50, pageWidth - 20, pageHeight - 50)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('This report was automatically generated by the Education CRM System.', 20, pageHeight - 40)
  doc.text(`Report ID: RPT-${Date.now()}`, 20, pageHeight - 30)
  
  // Footer
  doc.setTextColor(128, 128, 128)
  doc.setFontSize(8)
  doc.text('Education CRM System - Confidential Report', 20, pageHeight - 15)
  doc.text('Page 5', pageWidth - 30, pageHeight - 15)
  
  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="CRM-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  })
}
