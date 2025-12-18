'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProgramDescriptionDashboard } from '@/components/program-descriptions/program-description-dashboard'
import { FileText } from 'lucide-react'

export default function ProgramDescriptionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Program Descriptions
            </h1>
            <p className="text-gray-500 mt-1">
              Manage detailed descriptions and images for each program
            </p>
          </div>
        </div>

        <ProgramDescriptionDashboard />
      </div>
    </DashboardLayout>
  )
}

