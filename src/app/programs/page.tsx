'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProgramsDashboard } from '@/components/programs/programs-dashboard'
import { GraduationCap } from 'lucide-react'

export default function ProgramsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Programs
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your educational programs, courses, and levels
            </p>
          </div>
        </div>

        <ProgramsDashboard />
      </div>
    </DashboardLayout>
  )
}
