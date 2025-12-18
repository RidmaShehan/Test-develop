'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Campaign type is required'),
  targetAudience: z.string().min(1, 'Target audience is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return new Date(data.endDate) >= new Date(data.startDate)
  }
  return true
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface NewCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CampaignType {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
}

export function NewCampaignDialog({ open, onOpenChange }: NewCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: 'DRAFT',
    },
  })

  // Fetch campaign types when dialog opens
  useEffect(() => {
    if (open) {
      fetchCampaignTypes()
    }
  }, [open])

  const fetchCampaignTypes = async () => {
    try {
      const response = await fetch('/api/campaign-types')
      if (response.ok) {
        const data = await response.json()
        setCampaignTypes(data.filter((type: CampaignType) => type.isActive))
      }
    } catch (error) {
      console.error('Error fetching campaign types:', error)
    }
  }

  const onSubmit = async (data: CampaignFormData) => {
    // Prevent multiple submissions
    if (isLoading) {
      return
    }
    
    setIsLoading(true)
    try {
      // Convert dates to ISO strings and handle budget
      const submitData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        budget: data.budget && data.budget !== '' ? Number(data.budget) : null,
        imageUrl: imageUrl || null,
      }
      
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Please sign in to create campaigns')
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
        
        // Handle empty error responses
        if (!result || Object.keys(result).length === 0) {
          const errorMessage = `Server returned error status ${response.status} with no details`
          toast.error(errorMessage)
          return
        }
        
        throw new Error(result?.error || result?.details || 'Failed to create campaign')
      }

      toast.success('Campaign created successfully')
      form.reset()
      onOpenChange(false)
      // Refresh the campaigns list
      window.location.reload()
    } catch (error) {
      console.error('Error creating campaign:', error)
      
      if (error instanceof Error && error.message === 'Invalid response from server') {
        toast.error('Server returned invalid response')
      } else if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign'
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
          <DialogTitle>Add New Campaign</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Enter campaign name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

             <div className="space-y-2">
               <Label htmlFor="type">Campaign Type *</Label>
               <Select onValueChange={(value) => form.setValue('type', value)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select campaign type" />
                 </SelectTrigger>
                 <SelectContent>
                   {campaignTypes.map((type) => (
                     <SelectItem key={type.id} value={type.name}>
                       <div className="flex items-center space-x-2">
                         {type.icon && <span>{type.icon}</span>}
                         <span>{type.name}</span>
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               {form.formState.errors.type && (
                 <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
               )}
             </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience *</Label>
              <Input
                id="targetAudience"
                {...form.register('targetAudience')}
                placeholder="e.g., High school graduates, Working professionals"
              />
              {form.formState.errors.targetAudience && (
                <p className="text-sm text-red-600">{form.formState.errors.targetAudience.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                {...form.register('budget')}
                placeholder="Enter budget amount"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register('startDate')}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...form.register('endDate')}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue('status', value as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter campaign description"
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
               {isLoading ? 'Creating...' : 'Create Campaign'}
             </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
