import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ActivityLogsDashboard } from '@/components/admin/activity-logs-dashboard'

export default function ActivityLogsPage() {
  return (
    <DashboardLayout>
      <ActivityLogsDashboard />
    </DashboardLayout>
  )
}
