'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MeetingSchedule } from '@/components/meetings/meeting-schedule'

export default function MeetingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Schedule</h1>
          <p className="text-muted-foreground">
            Schedule and manage meetings with users and seekers
          </p>
        </div>
        
        <MeetingSchedule />
      </div>
    </DashboardLayout>
  )
}
