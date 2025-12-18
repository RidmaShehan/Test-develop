'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { MessageSquare, Loader2 } from 'lucide-react'

interface AddQADialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  onSuccess: () => void
}

export function AddQADialog({ open, onOpenChange, programId, onSuccess }: AddQADialogProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim() || !answer.trim()) {
      toast.error('Please fill in both question and answer')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/programs/${programId}/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          isActive,
        }),
      })

      if (response.ok) {
        toast.success('Q&A item added successfully')
        setQuestion('')
        setAnswer('')
        setIsActive(true)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add Q&A item')
      }
    } catch (error) {
      console.error('Error adding Q&A item:', error)
      toast.error('Failed to add Q&A item')
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
            Add New Q&A Item
          </DialogTitle>
          <DialogDescription>
            Add a frequently asked question and its answer for this program
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
              Add Q&A
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

