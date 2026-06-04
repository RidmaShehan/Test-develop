'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { QAManagementDashboard } from '@/components/q-and-a/qa-management-dashboard'
import { MessageSquare } from 'lucide-react'

export default function QAPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Q&A Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage frequently asked questions for each program
            </p>
          </div>
        </div>

        <QAManagementDashboard />
      </div>
    </DashboardLayout>
  )
}

