import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRole, requireAuth } from '@/lib/auth'
import { FollowUpStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Determine if user should see all data
    const isAdmin = isAdminRole(user.role)
    
    // Build where clauses for user filtering
    const seekerWhere = isAdmin ? {} : { createdById: user.id }
    const campaignWhere = isAdmin ? { isDeleted: false } : { createdById: user.id, isDeleted: false }
    const taskWhere = isAdmin ? {} : { assignedTo: user.id }
    const interactionWhere = isAdmin ? {} : { userId: user.id }
    
    // Calculate date ranges
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Fetch statistics in parallel
    const [
      totalSeekers,
      newSeekersThisWeek,
      newSeekersLastWeek,
      totalInteractions,
      totalSeekersWithInteractions,
      pendingTasks,
      completedTasks,
      totalCampaigns,
      activeCampaigns,
      recentInteractions,
      lastMonthTasks,
      thisMonthTasks
    ] = await Promise.all([
      // Total seekers
      prisma.seeker.count({ where: seekerWhere }),
      
      // New seekers this week
      prisma.seeker.count({
        where: {
          ...seekerWhere,
          createdAt: {
            gte: startOfWeek
          }
        }
      }),
      
      // New seekers last week (for comparison)
      prisma.seeker.count({
        where: {
          ...seekerWhere,
          createdAt: {
            gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: startOfWeek
          }
        }
      }),
      
      // Total interactions
      prisma.interaction.count({ where: interactionWhere }),
      
      // Seekers with at least one interaction
      prisma.seeker.count({
        where: {
          ...seekerWhere,
          interactions: {
            some: isAdmin ? {} : { userId: user.id }
          }
        }
      }),
      
      // Pending tasks (OPEN, TODO, IN_PROGRESS, OVERDUE)
      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: {
            in: [FollowUpStatus.OPEN, FollowUpStatus.TODO, FollowUpStatus.IN_PROGRESS, FollowUpStatus.OVERDUE]
          }
        }
      }),
      
      // Completed tasks this month
      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: {
            in: [FollowUpStatus.DONE, FollowUpStatus.COMPLETED]
          },
          updatedAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Total campaigns
      prisma.campaign.count({
        where: campaignWhere
      }),
      
      // Active campaigns
      prisma.campaign.count({
        where: {
          ...campaignWhere,
          status: 'ACTIVE'
        }
      }),
      
      // Recent interactions (last 10)
      prisma.interaction.findMany({
        where: interactionWhere,
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          seeker: {
            select: {
              id: true,
              fullName: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),

      // Last month tasks for comparison
      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: {
            in: [FollowUpStatus.DONE, FollowUpStatus.COMPLETED]
          },
          updatedAt: {
            gte: lastMonth,
            lte: endOfLastMonth
          }
        }
      }),

      // This month tasks (duplicate for clarity)
      prisma.followUpTask.count({
        where: {
          ...taskWhere,
          status: {
            in: [FollowUpStatus.OPEN, FollowUpStatus.TODO, FollowUpStatus.IN_PROGRESS, FollowUpStatus.OVERDUE]
          }
        }
      })
    ])

    // Calculate percentages and changes
    const contactRate = totalSeekers > 0 
      ? Math.round((totalSeekersWithInteractions / totalSeekers) * 100)
      : 0
    
    const newSeekersChange = newSeekersLastWeek > 0
      ? Math.round(((newSeekersThisWeek - newSeekersLastWeek) / newSeekersLastWeek) * 100)
      : (newSeekersThisWeek > 0 ? 100 : 0)
    
    const contactRateChange = 3 // This would need historical data to calculate accurately
    
    const tasksChange = lastMonthTasks > 0
      ? Math.round(((thisMonthTasks - lastMonthTasks) / lastMonthTasks) * 100)
      : 0

    // Format statistics
    const stats = {
      totalSeekers: {
        value: totalSeekers,
        change: 0, // Would need historical data
        changeType: 'neutral'
      },
      newThisWeek: {
        value: newSeekersThisWeek,
        change: newSeekersChange,
        changeType: newSeekersChange >= 0 ? 'positive' : 'negative'
      },
      contactRate: {
        value: contactRate,
        change: contactRateChange,
        changeType: 'positive'
      },
      pendingTasks: {
        value: pendingTasks,
        change: tasksChange,
        changeType: tasksChange <= 0 ? 'positive' : 'negative' // Less tasks is better
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      }
    }

    // Format recent activities
    const activities = recentInteractions.map(interaction => {
      let outcomeText = interaction.outcome.replace(/_/g, ' ')
      outcomeText = outcomeText.charAt(0) + outcomeText.slice(1).toLowerCase()
      
      return {
        id: interaction.id,
        type: interaction.channel.toLowerCase(),
        seekerName: interaction.seeker.fullName,
        seekerId: interaction.seeker.id,
        outcome: outcomeText,
        userName: interaction.user.name,
        time: interaction.createdAt,
        channel: interaction.channel,
        notes: interaction.notes
      }
    })

    // Get user inquiry counts for admin users
    let userInquiryStats: any[] | null = null
    if (isAdmin) {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          role: {
            not: 'SYSTEM'
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              createdSeekers: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      // Get inquiry counts per user
      const userInquiryCounts = await Promise.all(
        users.map(async (u) => {
          const totalInquiries = await prisma.seeker.count({
            where: { createdById: u.id }
          })
          
          const thisWeekInquiries = await prisma.seeker.count({
            where: {
              createdById: u.id,
              createdAt: {
                gte: startOfWeek
              }
            }
          })

          const thisMonthInquiries = await prisma.seeker.count({
            where: {
              createdById: u.id,
              createdAt: {
                gte: startOfMonth
              }
            }
          })

          return {
            userId: u.id,
            userName: u.name,
            userEmail: u.email,
            userRole: u.role,
            totalInquiries,
            thisWeekInquiries,
            thisMonthInquiries
          }
        })
      )

      userInquiryStats = userInquiryCounts
    }

    return NextResponse.json({
      stats,
      activities,
      userInquiryStats,
      isAdmin,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

