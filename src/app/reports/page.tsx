'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ReportsDashboard } from '@/components/reports/reports-dashboard'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Professional Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Comprehensive insights and performance metrics for your CRM
          </p>
        </div>

        <ReportsDashboard />
      </div>
    </DashboardLayout>
  )
}
