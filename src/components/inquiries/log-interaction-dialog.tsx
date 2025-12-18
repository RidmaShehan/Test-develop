'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const interactionSchema = z.object({
  channel: z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'WALK_IN']),
  outcome: z.enum(['CONNECTED_INTERESTED', 'NO_ANSWER', 'NOT_INTERESTED', 'APPOINTMENT_BOOKED', 'WRONG_NUMBER', 'DO_NOT_CONTACT']),
  notes: z.string().optional(),
})

type InteractionFormData = z.infer<typeof interactionSchema>

interface Inquiry {
  id: string
  fullName: string
  phone: string
}

interface LogInteractionDialogProps {
  inquiry: Inquiry
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LogInteractionDialog({ inquiry, open, onOpenChange, onSuccess }: LogInteractionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
  })

  const onSubmit = async (data: InteractionFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to log interaction')
      }

      toast.success('Interaction logged successfully')
      form.reset()
      onSuccess()
    } catch (error) {
      toast.error('Failed to log interaction')
      console.error('Error logging interaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Interaction - {inquiry.fullName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel">Channel *</Label>
            <Select onValueChange={(value) => form.setValue('channel', value as 'CALL' | 'WHATSAPP' | 'EMAIL' | 'WALK_IN')}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WALK_IN">Walk-in</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.channel && (
              <p className="text-sm text-red-600">{form.formState.errors.channel.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome *</Label>
            <Select onValueChange={(value) => form.setValue('outcome', value as 'CONNECTED_INTERESTED' | 'NO_ANSWER' | 'NOT_INTERESTED' | 'APPOINTMENT_BOOKED' | 'WRONG_NUMBER' | 'DO_NOT_CONTACT')}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONNECTED_INTERESTED">Connected - Interested</SelectItem>
                <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                <SelectItem value="APPOINTMENT_BOOKED">Appointment Booked</SelectItem>
                <SelectItem value="WRONG_NUMBER">Wrong Number</SelectItem>
                <SelectItem value="DO_NOT_CONTACT">Do Not Contact</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.outcome && (
              <p className="text-sm text-red-600">{form.formState.errors.outcome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging...' : 'Log Interaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
