'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NoteEditor } from '@/components/notebooks/note-editor'
import { useAuth } from '@/hooks/use-auth'
import { useParams } from 'next/navigation'

export default function NoteEditorPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const notebookId = params.notebookId as string
  const noteId = params.noteId as string

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
      <NoteEditor notebookId={notebookId} noteId={noteId} />
    </DashboardLayout>
  )
}

