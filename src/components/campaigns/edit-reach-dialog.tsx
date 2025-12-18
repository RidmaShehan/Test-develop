'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const reachSchema = z.object({
  reach: z.string().min(1, 'Reach value is required'),
})

type ReachFormData = z.infer<typeof reachSchema>

interface Campaign {
  id: string
  name: string
  reach?: number
}

interface EditReachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  onSuccess: () => void
}

export function EditReachDialog({ open, onOpenChange, campaign, onSuccess }: EditReachDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<ReachFormData>({
    resolver: zodResolver(reachSchema),
    defaultValues: {
      reach: '',
    },
  })

  // Update form when campaign changes
  useEffect(() => {
    if (campaign) {
      form.reset({
        reach: campaign.reach?.toString() || '',
      })
    }
  }, [campaign, form])

  const onSubmit = async (data: ReachFormData) => {
    if (!campaign) return
    
    // Prevent multiple submissions
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reach: parseInt(data.reach) }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to update reach')
          return
        }
        if (response.status === 400) {
          const errorMessage = result?.error || result?.details || 'Please fill in all required fields'
          toast.error(errorMessage)
          return
        }
        if (response.status === 500) {
          const errorMessage = result?.error || result?.details || 'Server error occurred'
          toast.error(errorMessage)
          return
        }
        
        throw new Error(result?.error || result?.details || 'Failed to update reach')
      }

      toast.success('Reach updated successfully')
      form.reset()
      onOpenChange(false)
      onSuccess() // Refresh the campaigns list
    } catch (error) {
      console.error('Error updating reach:', error)
      
      if (error instanceof Error && error.message === 'Invalid response from server') {
        toast.error('Server returned invalid response')
      } else if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update reach'
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Campaign Reach</DialogTitle>
        </DialogHeader>
        
        {campaign && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Campaign:</strong> {campaign.name}
            </p>
          </div>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reach">Actual Reach (Number of People Reached)</Label>
            <Input
              id="reach"
              type="number"
              min="0"
              {...form.register('reach')}
              placeholder="Enter actual reach achieved"
            />
            {form.formState.errors.reach && (
              <p className="text-sm text-red-600">{form.formState.errors.reach.message}</p>
            )}
            <p className="text-sm text-gray-500">
              Update this field after the campaign has run to record the actual number of people reached.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Reach'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
