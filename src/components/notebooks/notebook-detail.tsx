'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Plus, 
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Archive,
  Bell
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NoteForm } from './note-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface Note {
  id: string
  title: string
  content?: string
  icon?: string
  coverImage?: string
  isFavorite: boolean
  isArchived: boolean
  hasReminder?: boolean
  reminderDate?: string
  order: number
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    childNotes: number
  }
}

interface NotebookDetailProps {
  notebookId: string
}

export function NotebookDetail({ notebookId }: NotebookDetailProps) {
  const router = useRouter()
  const [notebook, setNotebook] = useState<any>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchNotebook()
  }, [notebookId])

  const fetchNotebook = async () => {
    try {
      const response = await fetch(`/api/notebooks/${notebookId}`)
      if (response.ok) {
        const data = await response.json()
        setNotebook(data)
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching notebook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = () => {
    setEditingNote(null)
    setShowNoteForm(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setShowNoteForm(true)
  }

  const handleSaveNote = async (noteData: any) => {
    setFormLoading(true)
    try {
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes'
      const method = editingNote ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...noteData,
          notebookId
        })
      })

      if (response.ok) {
        setShowNoteForm(false)
        setEditingNote(null)
        fetchNotebook()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchNotebook()
      } else {
        alert('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const handleToggleFavorite = async (note: Note) => {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFavorite: !note.isFavorite
        })
      })

      if (response.ok) {
        fetchNotebook()
      }
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!notebook) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Notebook not found</p>
        <Button onClick={() => router.push('/notebooks')} className="mt-4">
          Back to Notebooks
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/notebooks')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {notebook.icon && (
              <span className="text-3xl">{notebook.icon}</span>
            )}
            {!notebook.icon && (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: notebook.color || '#6366f1',
                  opacity: 0.1
                }}
              >
                <FileText 
                  className="h-6 w-6"
                  style={{ color: notebook.color || '#6366f1' }}
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{notebook.title}</h1>
              {notebook.description && (
                <p className="text-sm text-muted-foreground">{notebook.description}</p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleCreateNote} className="gap-2">
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first note in this notebook
            </p>
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/notebooks/${notebookId}/notes/${note.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {note.icon && (
                      <span className="text-xl">{note.icon}</span>
                    )}
                    <h3 className="font-semibold line-clamp-1">{note.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(note)
                      }}
                    >
                      <Star 
                        className={`h-4 w-4 ${note.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                      />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditNote(note)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(note.id)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {note.content && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                    {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {note.hasReminder && note.reminderDate && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Bell className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(note.reminderDate), { addSuffix: true })}</span>
                      </div>
                    )}
                    {note._count.childNotes > 0 && (
                      <span>{note._count.childNotes} {note._count.childNotes === 1 ? 'sub-note' : 'sub-notes'}</span>
                    )}
                  </div>
                  <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Note Form Dialog */}
      <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
          </DialogHeader>
          <NoteForm
            note={editingNote}
            onSave={handleSaveNote}
            onCancel={() => {
              setShowNoteForm(false)
              setEditingNote(null)
            }}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

