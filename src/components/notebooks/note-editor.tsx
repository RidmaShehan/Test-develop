'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Save,
  Star,
  MoreVertical,
  Trash2,
  Bell,
  CalendarIcon,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NoteEditorProps {
  notebookId: string
  noteId: string
}

export function NoteEditor({ notebookId, noteId }: NoteEditorProps) {
  const router = useRouter()
  const [note, setNote] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderDate, setReminderDate] = useState<Date>()
  const [reminderTime, setReminderTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const spaceSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchNote()
  }, [noteId])

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`)
      if (response.ok) {
        const data = await response.json()
        setNote(data)
        setTitle(data.title || '')
        setContent(data.content || '')
        setIcon(data.icon || '')
        setIsFavorite(data.isFavorite || false)
        setHasReminder(data.hasReminder || false)
        
        if (data.reminderDate) {
          const reminder = new Date(data.reminderDate)
          setReminderDate(reminder)
          setReminderTime(format(reminder, 'HH:mm'))
        }
      }
    } catch (error) {
      console.error('Error fetching note:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(async () => {
    if (saving || loading || !note) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          icon,
          isFavorite,
          hasReminder,
          reminderDate: hasReminder && reminderDate ? (() => {
            const [hours, minutes] = reminderTime ? reminderTime.split(':').map(Number) : [9, 0]
            const dateTime = new Date(reminderDate)
            dateTime.setHours(hours || 9, minutes || 0, 0, 0)
            return dateTime.toISOString()
          })() : null
        })
      })

      if (response.ok) {
        // Show success feedback
        const saveButton = document.querySelector('[data-save-button]')
        if (saveButton) {
          const originalText = saveButton.textContent
          saveButton.textContent = 'Saved!'
          setTimeout(() => {
            if (saveButton) {
              saveButton.textContent = originalText
            }
          }, 2000)
        }
        // Update note state to reflect saved changes
        const updatedReminderDate = hasReminder && reminderDate ? (() => {
          const [hours, minutes] = reminderTime ? reminderTime.split(':').map(Number) : [9, 0]
          const dateTime = new Date(reminderDate)
          dateTime.setHours(hours || 9, minutes || 0, 0, 0)
          return dateTime.toISOString()
        })() : null
        
        setNote((prev: any) => ({ 
          ...prev, 
          title, 
          content, 
          icon, 
          isFavorite,
          hasReminder,
          reminderDate: updatedReminderDate
        }))
      } else {
        alert('Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    } finally {
      setSaving(false)
    }
  }, [noteId, title, content, icon, isFavorite, hasReminder, reminderDate, reminderTime, saving, loading, note])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push(`/notebooks/${notebookId}`)
      } else {
        alert('Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const handleToggleFavorite = async () => {
    const newFavorite = !isFavorite
    setIsFavorite(newFavorite)
    
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFavorite: newFavorite
        })
      })
    } catch (error) {
      console.error('Error updating favorite:', error)
      setIsFavorite(!newFavorite) // Revert on error
    }
  }

  // Keyboard listener for Ctrl+S / Cmd+S and Space key to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault() // Prevent browser's default save dialog
        handleSave()
      }
      
      // Check for Space key press - save when space is pressed in the editor
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        // Only trigger save if typing in the content editor (not in title input)
        const isInEditor = target.closest('[contenteditable="true"]') || 
                          target.closest('.rich-text-editor') ||
                          (target.tagName === 'DIV' && target.contentEditable === 'true')
        
        if (isInEditor) {
          // Clear any pending space save
          if (spaceSaveTimeoutRef.current) {
            clearTimeout(spaceSaveTimeoutRef.current)
          }
          
          // Save immediately after space (with tiny debounce to batch rapid spaces)
          spaceSaveTimeoutRef.current = setTimeout(() => {
            if (!saving && !loading && note) {
              handleSave()
            }
          }, 300) // Small delay to batch multiple space presses
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (spaceSaveTimeoutRef.current) {
        clearTimeout(spaceSaveTimeoutRef.current)
      }
    }
  }, [handleSave, saving, loading, note])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Note not found</p>
        <Button onClick={() => router.push(`/notebooks/${notebookId}`)} className="mt-4">
          Back to Notebook
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/notebooks/${notebookId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="text-2xl font-bold border-0 shadow-none focus-visible:ring-0 px-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
          >
            <Star 
              className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
            />
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            data-save-button
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border rounded-lg min-h-[500px] bg-background">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing your note..."
          className="min-h-[500px] p-6"
        />
      </div>

      {/* Reminder Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label className="text-base font-medium">
              Reminder
            </Label>
          </div>
          <Switch
            checked={hasReminder}
            onCheckedChange={setHasReminder}
          />
        </div>

        {hasReminder && (
          <div className="space-y-3 pl-6 border-l-2 border-primary/20">
            <div className="grid grid-cols-2 gap-3">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !reminderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label className="text-sm">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="pl-9"
                    placeholder="09:00"
                  />
                </div>
              </div>
            </div>
            
            {reminderDate && (
              <p className="text-xs text-muted-foreground pl-1">
                Reminder set for {format(reminderDate, "PPP")} at {reminderTime || '09:00'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

