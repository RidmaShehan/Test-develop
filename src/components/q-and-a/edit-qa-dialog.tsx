'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { MessageSquare, Loader2 } from 'lucide-react'

interface QAItem {
  id: string
  programId: string
  question: string
  answer: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface EditQADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qaItem: QAItem
  onSuccess: () => void
}

export function EditQADialog({ open, onOpenChange, qaItem, onSuccess }: EditQADialogProps) {
  const [question, setQuestion] = useState(qaItem.question)
  const [answer, setAnswer] = useState(qaItem.answer)
  const [isActive, setIsActive] = useState(qaItem.isActive)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (qaItem) {
      setQuestion(qaItem.question)
      setAnswer(qaItem.answer)
      setIsActive(qaItem.isActive)
    }
  }, [qaItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim() || !answer.trim()) {
      toast.error('Please fill in both question and answer')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/programs/qa/${qaItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          order: qaItem.order,
          isActive,
        }),
      })

      if (response.ok) {
        toast.success('Q&A item updated successfully')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update Q&A item')
      }
    } catch (error) {
      console.error('Error updating Q&A item:', error)
      toast.error('Failed to update Q&A item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Edit Q&A Item
          </DialogTitle>
          <DialogDescription>
            Update the question and answer for this Q&A item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are the admission requirements?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer *</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a detailed answer to the question..."
              rows={6}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (visible in Q&A section)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Q&A
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

