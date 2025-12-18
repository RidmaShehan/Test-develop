'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { UserInquiryAnalytics } from '@/components/dashboard/user-inquiry-analytics'
import { NotificationDemo } from '@/components/notifications/notification-demo'
import { ClientOnly } from '@/components/ui/client-only'
import { useTheme } from '@/lib/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { compactMode } = useTheme()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to sign-in
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR' || user?.role === 'DEVELOPER'

  return (
    <DashboardLayout>
      <div className={cn(
        "transition-all duration-300",
        compactMode ? "space-y-4" : "space-y-6"
      )}>
        {/* Professional Header */}
        <div className="pb-4 border-b border-gray-200">
          <h1 className={cn(
            "font-bold text-gray-900 mb-1",
            compactMode ? "text-xl" : "text-2xl sm:text-3xl"
          )}>Dashboard</h1>
          <p className={cn(
            "text-gray-600",
            compactMode ? "text-sm" : "text-sm"
          )}>Welcome to your Education CRM dashboard</p>
        </div>

        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentActivity />
            {isAdmin && <UserInquiryAnalytics />}
          </div>
          <div>
            <ClientOnly>
              <NotificationDemo />
            </ClientOnly>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
