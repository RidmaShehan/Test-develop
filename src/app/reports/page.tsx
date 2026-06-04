'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const ReportsDashboard = dynamic(
  () => import('@/components/reports/reports-dashboard').then(m => ({ default: m.ReportsDashboard })),
  { loading: () => <div className="space-y-4"><div className="h-12 w-64 bg-muted rounded animate-pulse" /><div className="h-64 bg-muted rounded animate-pulse" /></div> }
)

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive insights and performance metrics for your CRM
          </p>
        </div>

        <ReportsDashboard />
      </div>
    </DashboardLayout>
  )
}
