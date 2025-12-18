'use client'

import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CampaignsDashboard } from '@/components/campaigns/campaigns-dashboard'

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth()
  const { hasPermission } = usePermissions()

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">Please sign in to access campaigns.</p>
        </div>
      </div>
    )
  }

  if (!hasPermission('READ_CAMPAIGN')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to view campaigns.</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <CampaignsDashboard />
    </DashboardLayout>
  )
}
