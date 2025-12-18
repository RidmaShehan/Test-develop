'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { NotebookList } from '@/components/notebooks/notebook-list'
import { NotebookForm } from '@/components/notebooks/notebook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { BookOpen } from 'lucide-react'

export default function NotebooksPage() {
  const { user, loading } = useAuth()
  const [showNotebookForm, setShowNotebookForm] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<any>(null)
  const [formLoading, setFormLoading] = useState(false)

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

  const handleCreateNotebook = () => {
    setEditingNotebook(null)
    setShowNotebookForm(true)
  }

  const handleEditNotebook = (notebook: any) => {
    setEditingNotebook(notebook)
    setShowNotebookForm(true)
  }

  const handleSaveNotebook = async (notebookData: any) => {
    setFormLoading(true)
    try {
      const url = editingNotebook ? `/api/notebooks/${editingNotebook.id}` : '/api/notebooks'
      const method = editingNotebook ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notebookData)
      })

      if (response.ok) {
        setShowNotebookForm(false)
        setEditingNotebook(null)
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save notebook')
      }
    } catch (error) {
      console.error('Error saving notebook:', error)
      alert('Failed to save notebook')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Notebooks
              </h1>
              <p className="text-gray-500 mt-1">
                Organize your thoughts and ideas like Notion
              </p>
            </div>
          </div>
        </div>

        <NotebookList 
          onCreateNotebook={handleCreateNotebook}
          onEditNotebook={handleEditNotebook}
        />

        {/* Notebook Form Dialog */}
        <Dialog open={showNotebookForm} onOpenChange={setShowNotebookForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNotebook ? 'Edit Notebook' : 'Create New Notebook'}
              </DialogTitle>
            </DialogHeader>
            <NotebookForm
              notebook={editingNotebook}
              onSave={handleSaveNotebook}
              onCancel={() => {
                setShowNotebookForm(false)
                setEditingNotebook(null)
              }}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

