'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme-provider'
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function HeaderSettings() {
  const { sidebarCollapsed, setSidebarCollapsed } = useTheme()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="p-2"
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      
      <ThemeToggle />
      
      <Button variant="ghost" size="sm" asChild>
        <Link href="/settings" title="Settings">
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
