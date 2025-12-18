'use client'

import { Sidebar } from './sidebar'
import { HeaderSettings } from './header-settings'
import { NotificationPanel } from '@/components/notifications/notification-panel'
import { useMeetingReminderService } from '@/services/meeting-reminder-service'
import { ClientOnly } from '@/components/ui/client-only'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme-provider'
import { cn } from '@/lib/utils'

// Component to initialize meeting reminder service
function MeetingReminderService() {
  useMeetingReminderService()
  return null
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { sidebarCollapsed, compactMode } = useTheme()

  return (
    <div className="flex h-screen bg-background">
      {/* Initialize meeting reminder service only on client side */}
      <ClientOnly>
        <MeetingReminderService />
      </ClientOnly>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
          <Sidebar />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col transition-all duration-300",
        sidebarCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex h-16 items-center justify-between bg-background border-b px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold" suppressHydrationWarning>Education CRM</h1>
            <div className="flex items-center gap-2">
              <ClientOnly>
                <NotificationPanel />
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Desktop header with sidebar toggle */}
        <div className="hidden lg:flex h-16 items-center justify-between bg-background border-b px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold" suppressHydrationWarning>Education CRM</h1>
          </div>
          <div className="flex items-center gap-2">
            <ClientOnly>
              <NotificationPanel />
            </ClientOnly>
            <HeaderSettings />
          </div>
        </div>

        {/* Page content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-6 transition-all duration-300",
          compactMode ? "p-4" : "p-6"
        )}>
          <div className={cn(
            "transition-all duration-300",
            compactMode ? "space-y-4" : "space-y-6"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
