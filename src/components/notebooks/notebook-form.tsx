'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface NotebookFormProps {
  notebook?: any
  onSave: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export function NotebookForm({ notebook, onSave, onCancel, loading }: NotebookFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#6366f1')

  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title || '')
      setDescription(notebook.description || '')
      setIcon(notebook.icon || '')
      setColor(notebook.color || '#6366f1')
    }
  }, [notebook])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      description,
      icon,
      color
    })
  }

  const commonIcons = ['📓', '📝', '📚', '📖', '📄', '📑', '🗂️', '📋', '💡', '🎯', '📌', '⭐']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Notebook"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of this notebook"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icon (Emoji)</Label>
        <div className="flex gap-2">
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="📓"
            maxLength={2}
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
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366f1"
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : notebook ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

