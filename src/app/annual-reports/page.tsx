import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AnnualReportsDashboard } from '@/components/admin/annual-reports-dashboard'

export default function AnnualReportsPage() {
  return (
    <DashboardLayout>
      <AnnualReportsDashboard />
    </DashboardLayout>
  )
}
