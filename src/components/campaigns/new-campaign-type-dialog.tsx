'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const campaignTypeSchema = z.object({
  name: z.string().min(1, 'Campaign type name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
})

type CampaignTypeFormData = z.infer<typeof campaignTypeSchema>

interface NewCampaignTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewCampaignTypeDialog({ open, onOpenChange, onSuccess }: NewCampaignTypeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<CampaignTypeFormData>({
    resolver: zodResolver(campaignTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6', // Default blue color
    },
  })

  const onSubmit = async (data: CampaignTypeFormData) => {
    if (isLoading) {
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/campaign-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to create campaign types')
          return
        }
        if (response.status === 400) {
          const errorMessage = result?.error || 'Please fill in all required fields'
          toast.error(errorMessage)
          return
        }
        if (response.status === 500) {
          const errorMessage = result?.error || 'Server error occurred'
          toast.error(errorMessage)
          return
        }
        
        if (!result || Object.keys(result).length === 0) {
          const errorMessage = `Server returned error status ${response.status} with no details`
          toast.error(errorMessage)
          return
        }
        
        throw new Error(result?.error || 'Failed to create campaign type')
      }

      toast.success('Campaign type created successfully')
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error creating campaign type:', error)
      
      if (error instanceof Error && error.message === 'Invalid response from server') {
        toast.error('Server returned invalid response')
      } else if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign type'
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Campaign Type</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Type Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="e.g., Social Media, Email Marketing"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>


            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="color"
                  type="color"
                  {...form.register('color')}
                  className="w-16 h-10 p-1"
                />
                <Input
                  {...form.register('color')}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter campaign type description"
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
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Campaign Type'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
