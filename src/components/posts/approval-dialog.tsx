'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle } from 'lucide-react'

interface ApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'approve' | 'reject'
  onConfirm: (comment: string) => void
  loading?: boolean
}

export function ApprovalDialog({
  open,
  onOpenChange,
  type,
  onConfirm,
  loading = false,
}: ApprovalDialogProps) {
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (type === 'reject' && !comment.trim()) {
      return // Don't submit if reject requires comment
    }
    onConfirm(comment.trim())
    setComment('') // Reset on submit
  }

  const handleCancel = () => {
    setComment('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'approve' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approve Post
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                Reject Post
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === 'approve'
              ? 'Add an optional comment to this approval. This will be visible to the post creator and other approvers.'
              : 'Please provide a reason for rejecting this post. This comment is required and will be visible to the post creator.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment {type === 'reject' && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="comment"
              placeholder={
                type === 'approve'
                  ? 'Add an optional comment...'
                  : 'Please explain why you are rejecting this post...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {type === 'reject' && (
              <p className="text-xs text-muted-foreground">
                A rejection reason is required to help the creator improve the post.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={type === 'approve' ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={loading || (type === 'reject' && !comment.trim())}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {type === 'approve' ? 'Approving...' : 'Rejecting...'}
              </>
            ) : (
              <>
                {type === 'approve' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

