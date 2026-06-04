'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NewInquiryButton } from '@/components/inquiries/new-inquiry-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Lazy-load heavy tables to reduce INP and initial bundle (target INP ≤200ms)
function TableLoader() {
  return (
    <div className="flex items-center justify-center min-h-[320px]" aria-hidden>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  )
}

const InquiriesTable = dynamic(
  () => import('@/components/inquiries/inquiries-table').then((m) => ({ default: m.InquiriesTable })),
  { loading: TableLoader, ssr: false }
)

const RequestInquiriesTable = dynamic(
  () => import('@/components/inquiries/request-inquiries-table').then((m) => ({ default: m.RequestInquiriesTable })),
  { loading: TableLoader, ssr: false }
)

const InquiryPipeline = dynamic(
  () => import('@/components/inquiries/inquiry-pipeline').then((m) => ({ default: m.InquiryPipeline })),
  { loading: TableLoader, ssr: false }
)

export default function InquiriesPage() {
  const { user, loading: authLoading } = useAuth()
  const { hasPermission } = usePermissions()
  const [pipelineData, setPipelineData] = useState<any>(null)
  const [pipelineLoading, setPipelineLoading] = useState(false)

  const fetchPipeline = async () => {
    setPipelineLoading(true)
    try {
      const res = await fetch('/api/inquiries/pipeline')
      const data = await res.json()
      if (data.success) setPipelineData(data.data)
    } catch {
      // pipeline fetch failure is non-critical
    } finally {
      setPipelineLoading(false)
    }
  }

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
          <p className="mt-2 text-gray-600">Please sign in to access inquiries.</p>
        </div>
      </div>
    )
  }

  if (!hasPermission('READ_SEEKER')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to view inquiries.</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Inquiries</h1>
            <p className="text-sm text-gray-600">
              Manage all student inquiries and leads
              {hasPermission('CREATE_SEEKER') && (
                <span className="ml-2 text-xs text-gray-500">
                  • Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">⌘↵</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl↵</kbd> to create new inquiry
                </span>
              )}
            </p>
          </div>
          {hasPermission('CREATE_SEEKER') && <NewInquiryButton />}
        </div>
        
        <Tabs defaultValue="inquiries" className="w-full" onValueChange={(v) => { if (v === 'pipeline' && !pipelineData) fetchPipeline() }}>
          <TabsList>
            <TabsTrigger value="inquiries">All Inquiries</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="requests">Request Inquiries</TabsTrigger>
          </TabsList>
          <TabsContent value="inquiries" className="mt-4">
            <InquiriesTable />
          </TabsContent>
          <TabsContent value="pipeline" className="mt-4">
            {pipelineLoading ? (
              <TableLoader />
            ) : pipelineData ? (
              <InquiryPipeline data={pipelineData} onRefresh={fetchPipeline} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Click the Pipeline tab to load the board.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="requests" className="mt-4">
            <RequestInquiriesTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
