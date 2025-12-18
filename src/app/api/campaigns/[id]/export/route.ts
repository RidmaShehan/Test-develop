import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: campaignId } = await params

    // Fetch campaign with all related data
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seekers: {
          include: {
            seeker: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                city: true,
                marketingSource: true,
                stage: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        },
        _count: {
          select: {
            seekers: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const doc = new jsPDF()
    
    // Helper function to add page numbers
    const addPageNumber = () => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      doc.setFontSize(9)
      doc.setTextColor(128, 128, 128)
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 30,
        doc.internal.pageSize.getHeight() - 10
      )
    }

    // ========== COVER PAGE ==========
    doc.setFillColor(41, 128, 185)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(26)
    doc.text('Campaign Report', 20, 30)
    
    doc.setFontSize(14)
    doc.text(campaign.name, 20, 45)
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
    
    // Campaign overview box
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Campaign Overview', 20, 80)
    doc.setFont('helvetica', 'normal')
    
    // Campaign details table
    const overviewData = [
      ['Campaign Name', campaign.name],
      ['Type', campaign.type],
      ['Status', campaign.status],
      ['Target Audience', campaign.targetAudience],
      ['Start Date', new Date(campaign.startDate).toLocaleDateString()],
      ['End Date', campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'],
      ['Budget', campaign.budget ? `$${campaign.budget.toLocaleString()}` : 'Not specified'],
      ['Reach', campaign.reach ? campaign.reach.toLocaleString() : 'Not specified'],
      ['Total Seekers', (campaign._count?.seekers || 0).toString()],
      ['Created By', campaign.createdBy?.name || 'Unknown'],
      ['Created On', new Date(campaign.createdAt).toLocaleDateString()]
    ]

    if (campaign.description) {
      overviewData.push(['Description', campaign.description])
    }

    autoTable(doc, {
      startY: 90,
      head: [['Field', 'Value']],
      body: overviewData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 130 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    })

    // ========== ANALYTICS PAGE ==========
    if (campaign.views || campaign.totalInteractions) {
      doc.addPage()
      
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Campaign Analytics', 20, 20)
      doc.setFont('helvetica', 'normal')

      // Performance Metrics
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Performance Metrics', 20, 35)
      doc.setFont('helvetica', 'normal')

      const analyticsData = [
        ['Views', (campaign.views || 0).toLocaleString()],
        ['Net Follows', (campaign.netFollows || 0).toLocaleString()],
        ['Total Watch Time', campaign.totalWatchTime ? `${Math.floor(campaign.totalWatchTime / 60)} min` : '0 min'],
        ['Average Watch Time', campaign.averageWatchTime ? `${campaign.averageWatchTime} sec` : '0 sec'],
        ['Total Interactions', (campaign.totalInteractions || 0).toLocaleString()],
        ['Reactions', (campaign.reactions || 0).toLocaleString()],
        ['Comments', (campaign.comments || 0).toLocaleString()],
        ['Shares', (campaign.shares || 0).toLocaleString()],
        ['Saves', (campaign.saves || 0).toLocaleString()],
        ['Link Clicks', (campaign.linkClicks || 0).toLocaleString()]
      ]

      autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: analyticsData,
        theme: 'grid',
        headStyles: {
          fillColor: [46, 204, 113],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 100, halign: 'right' }
        }
      })

      // Calculate engagement rate
      const engagementRate = campaign.views && campaign.views > 0
        ? ((campaign.totalInteractions || 0) / campaign.views * 100).toFixed(2)
        : '0.00'

      const finalY = (doc as any).lastAutoTable.finalY || 150

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Key Insights:', 20, finalY + 15)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`• Engagement Rate: ${engagementRate}%`, 25, finalY + 25)
      doc.text(`• Average Watch Time: ${campaign.averageWatchTime || 0} seconds`, 25, finalY + 35)
      doc.text(`• Total Reach: ${campaign.reach || 0} people`, 25, finalY + 45)
    }

    // ========== SEEKERS PAGE ==========
    if (campaign.seekers.length > 0) {
      doc.addPage()
      
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Campaign Seekers', 20, 20)
      doc.setFont('helvetica', 'normal')

      doc.setFontSize(12)
      doc.text(`Total Seekers: ${campaign.seekers.length}`, 20, 30)

      // Seekers table
      const seekersData = campaign.seekers.map((cs, index) => [
        (index + 1).toString(),
        cs.seeker.fullName,
        cs.seeker.phone,
        cs.seeker.email || 'N/A',
        cs.seeker.city || 'N/A',
        cs.seeker.stage,
        new Date(cs.addedAt).toLocaleDateString()
      ])

      autoTable(doc, {
        startY: 40,
        head: [['#', 'Name', 'Phone', 'Email', 'City', 'Stage', 'Added On']],
        body: seekersData,
        theme: 'striped',
        headStyles: {
          fillColor: [155, 89, 182],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      })

      // Seekers by stage analysis
      const seekersByStage = campaign.seekers.reduce((acc, cs) => {
        const stage = cs.seeker.stage
        acc[stage] = (acc[stage] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      if (Object.keys(seekersByStage).length > 0) {
        const stageY = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Seekers by Stage', 20, stageY)
        doc.setFont('helvetica', 'normal')

        const stageData = Object.entries(seekersByStage)
          .sort((a, b) => b[1] - a[1])
          .map(([stage, count]) => [
            stage,
            count.toString(),
            `${((count / campaign.seekers.length) * 100).toFixed(1)}%`
          ])

        autoTable(doc, {
          startY: stageY + 5,
          head: [['Stage', 'Count', 'Percentage']],
          body: stageData,
          theme: 'grid',
          headStyles: {
            fillColor: [230, 126, 34],
            textColor: 255
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          }
        })
      }
    }

    // ========== SUMMARY PAGE ==========
    doc.addPage()
    
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Campaign Summary', 20, 20)
    doc.setFont('helvetica', 'normal')

    // Key Performance Indicators
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Performance Indicators (KPIs)', 20, 35)
    doc.setFont('helvetica', 'normal')

    const seekerCount = campaign._count?.seekers || 0
    const kpiData = [
      ['Total Reach', (campaign.reach || 0).toLocaleString()],
      ['Total Views', (campaign.views || 0).toLocaleString()],
      ['Total Interactions', (campaign.totalInteractions || 0).toLocaleString()],
      ['Total Seekers Generated', seekerCount.toString()],
      ['Conversion Rate', campaign.reach && campaign.reach > 0 
        ? `${((seekerCount / campaign.reach) * 100).toFixed(2)}%`
        : 'N/A'],
      ['Cost Per Seeker', campaign.budget && seekerCount > 0
        ? `$${(campaign.budget / seekerCount).toFixed(2)}`
        : 'N/A'],
      ['ROI Metric', campaign.budget && campaign.totalInteractions
        ? `${((campaign.totalInteractions / campaign.budget) * 100).toFixed(2)}%`
        : 'N/A']
    ]

    autoTable(doc, {
      startY: 45,
      head: [['KPI', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 12
      },
      bodyStyles: {
        fontSize: 11
      },
      columnStyles: {
        0: { cellWidth: 90, fontStyle: 'bold' },
        1: { cellWidth: 90, halign: 'right', fontSize: 12, fontStyle: 'bold' }
      }
    })

    // Campaign Status Box
    const summaryY = (doc as any).lastAutoTable.finalY + 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Campaign Status', 20, summaryY)
    doc.setFont('helvetica', 'normal')

    // Status indicator
    const statusColors: Record<string, [number, number, number]> = {
      'DRAFT': [149, 165, 166],
      'ACTIVE': [46, 204, 113],
      'PAUSED': [241, 196, 15],
      'COMPLETED': [52, 152, 219],
      'CANCELLED': [231, 76, 60]
    }

    const statusColor = statusColors[campaign.status] || [149, 165, 166]
    doc.setFillColor(...statusColor)
    doc.roundedRect(20, summaryY + 5, 60, 12, 3, 3, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text(campaign.status, 30, summaryY + 13)
    doc.setTextColor(0, 0, 0)

    // Footer with generation info
    doc.setFontSize(9)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Report generated on ${new Date().toLocaleString()}`,
      20,
      doc.internal.pageSize.getHeight() - 20
    )
    doc.text(
      `Generated by: ${user.name}`,
      20,
      doc.internal.pageSize.getHeight() - 15
    )

    // Add page numbers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addPageNumber()
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    const filename = `campaign-${campaign.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to export campaign' },
      { status: 500 }
    )
  }
}

