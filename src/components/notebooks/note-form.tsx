'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface NoteFormProps {
  note?: any
  onSave: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function NoteForm({ note, onSave, onCancel, loading }: NoteFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState('')
  const [hasReminder, setHasReminder] = useState(false)
  const [reminderDate, setReminderDate] = useState<Date>()
  const [reminderTime, setReminderTime] = useState('')

  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setContent(note.content || '')
      setIcon(note.icon || '')
      setHasReminder(note.hasReminder || false)
      
      if (note.reminderDate) {
        const reminder = new Date(note.reminderDate)
        setReminderDate(reminder)
        setReminderTime(format(reminder, 'HH:mm'))
      }
    }
  }, [note])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let reminderDateTime: Date | null = null
    if (hasReminder && reminderDate) {
      const [hours, minutes] = reminderTime ? reminderTime.split(':').map(Number) : [9, 0]
      reminderDateTime = new Date(reminderDate)
      reminderDateTime.setHours(hours || 9, minutes || 0, 0, 0)
    }
    
    onSave({
      title,
      content,
      icon,
      hasReminder,
      reminderDate: reminderDateTime
    })
  }

  const commonIcons = ['📝', '📄', '📋', '📌', '💡', '🎯', '⭐', '🔥', '✨', '🎨', '💭']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="icon">Icon (Emoji)</Label>
        <div className="flex gap-2">
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📝"
            maxLength={2}
            className="w-20"
          />
          <div className="flex gap-1 flex-wrap">
            {commonIcons.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className="text-xl hover:scale-110 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          required
          className="text-lg font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <div className="border rounded-md min-h-[300px]">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your note..."
            className="min-h-[300px] p-4"
          />
        </div>
      </div>

      {/* Reminder Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="reminder" className="text-base font-medium">
              Reminder
            </Label>
          </div>
          <Switch
            id="reminder"
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

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : note ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

