'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotebookDetail } from '@/components/notebooks/notebook-detail'
import { useAuth } from '@/hooks/use-auth'
import { useParams } from 'next/navigation'

export default function NotebookDetailPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const notebookId = params.notebookId as string

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
    return null
  }

  return (
    <DashboardLayout>
      <NotebookDetail notebookId={notebookId} />
    </DashboardLayout>
  )
}
