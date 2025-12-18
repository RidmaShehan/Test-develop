'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  BookOpen, 
  MoreVertical,
  Trash2,
  Edit,
  Archive
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Notebook {
  id: string
  title: string
  description?: string
  icon?: string
  color?: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    notes: number
  }
}

interface NotebookListProps {
  onCreateNotebook?: () => void
  onEditNotebook?: (notebook: Notebook) => void
}

export function NotebookList({ onCreateNotebook, onEditNotebook }: NotebookListProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotebooks()
  }, [])

  const fetchNotebooks = async () => {
    try {
      const response = await fetch('/api/notebooks')
      if (response.ok) {
        const data = await response.json()
        setNotebooks(data)
      }
    } catch (error) {
      console.error('Error fetching notebooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notebook? All notes inside will also be deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/notebooks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchNotebooks()
      } else {
        alert('Failed to delete notebook')
      }
    } catch (error) {
      console.error('Error deleting notebook:', error)
      alert('Failed to delete notebook')
    }
  }

  const handleArchive = async (notebook: Notebook) => {
    try {
      const response = await fetch(`/api/notebooks/${notebook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isArchived: !notebook.isArchived
        })
      })

      if (response.ok) {
        fetchNotebooks()
      } else {
        alert('Failed to update notebook')
      }
    } catch (error) {
      console.error('Error archiving notebook:', error)
      alert('Failed to archive notebook')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Notebooks</h2>
          <p className="text-sm text-muted-foreground">
            {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
          </p>
        </div>
        <Button onClick={onCreateNotebook} className="gap-2">
          <Plus className="h-4 w-4" />
          New Notebook
        </Button>
      </div>

      {notebooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notebooks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first notebook to start organizing your notes
            </p>
            <Button onClick={onCreateNotebook}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notebook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((notebook) => (
            <Card
              key={notebook.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/notebooks/${notebook.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {notebook.icon && (
                      <span className="text-2xl">{notebook.icon}</span>
                    )}
                    {!notebook.icon && (
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: notebook.color || '#6366f1',
                          opacity: 0.1
                        }}
                      >
                        <BookOpen 
                          className="h-5 w-5"
                          style={{ color: notebook.color || '#6366f1' }}
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg line-clamp-1">
                      {notebook.title}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditNotebook?.(notebook)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchive(notebook)
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {notebook.isArchived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notebook.id)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {notebook.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {notebook.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{notebook._count.notes} {notebook._count.notes === 1 ? 'note' : 'notes'}</span>
                  <span>{formatDistanceToNow(new Date(notebook.updatedAt), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

