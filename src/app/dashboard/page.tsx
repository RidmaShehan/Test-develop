'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useTheme } from '@/lib/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { DashboardFilterBar } from '@/components/dashboard/dashboard-filter-bar'
import type { DashboardFilterState, DashboardPreset } from '@/components/dashboard/dashboard-types'
import type { DashboardStatsData } from '@/components/dashboard/dashboard-stats'
import type { UserInquiryStat } from '@/components/dashboard/user-inquiry-analytics'
import type { CoordinatorAssignedCampaign } from '@/components/dashboard/coordinator-assigned-campaigns'
import { safeJsonParse } from '@/lib/utils'
import { RoleBasedDashboard } from '@/components/dashboard/role-based-dashboard'

const DashboardStats = dynamic(
  () => import('@/components/dashboard/dashboard-stats').then((m) => ({ default: m.DashboardStats })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    ),
  }
)
const UserInquiryAnalytics = dynamic(
  () => import('@/components/dashboard/user-inquiry-analytics').then((m) => ({ default: m.UserInquiryAnalytics })),
  { loading: () => <div className="h-64 rounded-lg bg-muted animate-pulse" /> }
)
const DashboardReportCharts = dynamic(
  () => import('@/components/dashboard/dashboard-report-charts').then((m) => ({ default: m.DashboardReportCharts })),
  { loading: () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="h-[350px] rounded-lg bg-muted animate-pulse" /><div className="h-[350px] rounded-lg bg-muted animate-pulse" /></div> }
)

const DEFAULT_FILTERS: DashboardFilterState = {
  preset: 'this_week',
  dateFrom: null,
  dateTo: null,
  userId: '',
  campaignId: '',
}

function buildDashboardQuery(filters: DashboardFilterState): string {
  const params = new URLSearchParams()
  params.set('preset', filters.preset)
  if (filters.preset === 'custom' && filters.dateFrom && filters.dateTo) {
    params.set('dateFrom', filters.dateFrom.toISOString().slice(0, 10))
    params.set('dateTo', filters.dateTo.toISOString().slice(0, 10))
  }
  if (filters.userId) params.set('userId', filters.userId)
  if (filters.campaignId) params.set('campaignId', filters.campaignId)
  params.set('limit', '20')
  return params.toString()
}

function DashboardPageContent() {
  const searchParams = useSearchParams()
  const { compactMode } = useTheme()
  const { user, loading: authLoading } = useAuth()

  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_FILTERS)
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStatsData | null
    activities: Array<{
      id: string
      type: string
      title: string
      description: string
      timestamp: string
      userName?: string
    }>
    userInquiryStats: UserInquiryStat[] | null
    users: { id: string; name: string }[]
    campaigns: { id: string; name: string }[]
    assignedCampaigns: CoordinatorAssignedCampaign[]
    isAdmin: boolean
  } | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR' || user?.role === 'DEVELOPER'

  const fetchDashboard = useCallback(
    async (filterState: DashboardFilterState) => {
      setDashboardLoading(true)
      setDashboardError(null)
      try {
        const query = buildDashboardQuery(filterState)
        const res = await fetch(`/api/dashboard?${query}`)
        if (!res.ok) {
          setDashboardError('Failed to load dashboard data')
          setDashboardData(null)
          return
        }
        const data = await safeJsonParse(res)
        setDashboardData({
          stats: (data.stats as DashboardStatsData) ?? null,
          activities: data.activities ?? [],
          userInquiryStats: (data.userInquiryStats as UserInquiryStat[]) ?? null,
          users: data.users ?? [],
          campaigns: data.campaigns ?? [],
          assignedCampaigns: (data.assignedCampaigns as CoordinatorAssignedCampaign[]) ?? [],
          isAdmin: data.isAdmin ?? false,
        })
      } catch {
        setDashboardError('Failed to load dashboard data')
        setDashboardData(null)
      } finally {
        setDashboardLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const preset = (searchParams.get('preset') as DashboardPreset) || DEFAULT_FILTERS.preset
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId') ?? ''
    const campaignId = searchParams.get('campaignId') ?? ''

    const initial: DashboardFilterState = {
      preset: ['all', 'today', 'this_week', 'this_month', 'last_7', 'last_30', 'custom'].includes(preset)
        ? preset
        : 'this_week',
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      userId,
      campaignId,
    }
    setFilters(initial)
    fetchDashboard(initial)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init from URL once

  const handleFiltersChange = useCallback(
    (newFilters: DashboardFilterState) => {
      setFilters(newFilters)
      fetchDashboard(newFilters)
      const query = buildDashboardQuery(newFilters)
      const url = query ? `?${query}` : window.location.pathname
      window.history.replaceState(null, '', url)
    },
    [fetchDashboard]
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div
        className={cn(
          'transition-all duration-300',
          compactMode ? 'space-y-4' : 'space-y-6'
        )}
      >
        <div className="pb-4 border-b border-border/60">
          <h1
            className={cn(
              'font-bold text-foreground mb-1',
              compactMode ? 'text-xl' : 'text-2xl sm:text-3xl'
            )}
          >
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to your Education CRM dashboard. Use filters for quick analysis.
          </p>
        </div>

        <DashboardFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isAdmin={isAdmin}
          users={dashboardData?.users ?? []}
          campaigns={dashboardData?.campaigns ?? []}
        />

        {/* Role-based Personalized Dashboard */}
        <RoleBasedDashboard
          stats={dashboardData?.stats ?? null}
          userInquiryStats={dashboardData?.userInquiryStats ?? null}
          assignedCampaigns={dashboardData?.assignedCampaigns ?? []}
          loading={dashboardLoading}
          error={dashboardError}
        />

        {/* Charts (legacy components). Stats cards are already shown by RoleBasedDashboard. */}
        <DashboardReportCharts />
        {isAdmin && (
          <UserInquiryAnalytics
            userInquiryStats={dashboardData?.userInquiryStats ?? null}
            loading={dashboardLoading}
            error={dashboardError}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  )
}
