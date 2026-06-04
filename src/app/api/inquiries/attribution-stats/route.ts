import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticationError } from '@/lib/auth'
import { canViewAllInquiries } from '@/lib/inquiry-visibility'

/**
 * GET /api/inquiries/attribution-stats
 * Inquiry counts by campaign (linked via campaign_seekers) and by marketing source,
 * plus registered (registerNow) counts. Mirrors /api/inquiries visibility: admins see
 * all non-deleted inquiries; others only those they created.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const viewAll = await canViewAllInquiries(user.id, user.role)
    const seekerBase: Prisma.SeekerWhereInput = {
      NOT: { isDeleted: true },
      ...(viewAll ? {} : { createdById: user.id }),
    }

    const [
      inquiriesByCampaign,
      registeredByCampaign,
      inquiriesBySource,
      registeredBySource,
      campaignsMeta,
    ] = await Promise.all([
      prisma.campaignSeeker.groupBy({
        by: ['campaignId'],
        where: { seeker: seekerBase },
        _count: { _all: true },
      }),
      prisma.campaignSeeker.groupBy({
        by: ['campaignId'],
        where: {
          seeker: { ...seekerBase, registerNow: true },
        },
        _count: { _all: true },
      }),
      prisma.seeker.groupBy({
        by: ['marketingSource'],
        where: seekerBase,
        _count: { _all: true },
      }),
      prisma.seeker.groupBy({
        by: ['marketingSource'],
        where: { ...seekerBase, registerNow: true } satisfies Prisma.SeekerWhereInput,
        _count: { _all: true },
      }),
      prisma.campaign.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
      }),
    ])

    const registeredMap = new Map(
      registeredByCampaign.map((r) => [r.campaignId, r._count._all])
    )
    const campaignById = new Map(campaignsMeta.map((c) => [c.id, c]))

    const byCampaign = inquiriesByCampaign
      .map((row) => {
        const meta = campaignById.get(row.campaignId)
        return {
          campaignId: row.campaignId,
          campaignName: meta?.name ?? 'Unknown campaign',
          type: meta?.type ?? null,
          status: meta?.status ?? null,
          inquiryCount: row._count._all,
          registeredCount: registeredMap.get(row.campaignId) ?? 0,
        }
      })
      .sort((a, b) => b.inquiryCount - a.inquiryCount)

    const registeredSourceMap = new Map(
      registeredBySource.map((r) => [r.marketingSource, r._count._all])
    )

    const byMarketingSource = inquiriesBySource
      .map((row) => ({
        marketingSource: row.marketingSource,
        inquiryCount: row._count._all,
        registeredCount: registeredSourceMap.get(row.marketingSource) ?? 0,
      }))
      .sort((a, b) => b.inquiryCount - a.inquiryCount)

    return NextResponse.json({
      byCampaign,
      byMarketingSource,
    })
  } catch (error) {
    console.error('Error in /api/inquiries/attribution-stats:', error)
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to load attribution stats' },
      { status: 500 }
    )
  }
}
