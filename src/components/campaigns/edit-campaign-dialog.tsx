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
  reach: z.string().optional(),
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

interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  targetAudience: string
  startDate: string
  endDate?: string
  budget?: number
  reach?: number
  imageUrl?: string
  status: string
}

interface EditCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  onSuccess: () => void
}

interface CampaignType {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
}

export function EditCampaignDialog({ open, onOpenChange, campaign, onSuccess }: EditCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      type: '',
      targetAudience: '',
      startDate: '',
      endDate: '',
      budget: '',
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

  // Update form when campaign changes
  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        description: campaign.description || '',
        type: campaign.type as any,
        targetAudience: campaign.targetAudience,
        startDate: campaign.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
        budget: campaign.budget?.toString() || '',
        reach: campaign.reach?.toString() || '',
        imageUrl: campaign.imageUrl || '',
        status: campaign.status as any,
      })
      setImageUrl(campaign.imageUrl || null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign])

  const onSubmit = async (data: CampaignFormData) => {
    if (!campaign) return
    
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // Convert dates to ISO strings and handle budget
      const submitData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        budget: data.budget && data.budget !== '' ? Number(data.budget) : null,
        reach: data.reach && data.reach !== '' ? Number(data.reach) : null,
        imageUrl: imageUrl || null,
      }
      
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to edit campaigns')
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
        
        if (!result || Object.keys(result).length === 0) {
          const errorMessage = `Server returned error status ${response.status} with no details`
          toast.error(errorMessage)
          return
        }
        
        throw new Error(result?.error || result?.details || 'Failed to update campaign')
      }

      toast.success('Campaign updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating campaign:', error)
      
      if (error instanceof Error && error.message === 'Invalid response from server') {
        toast.error('Server returned invalid response')
      } else if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update campaign'
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
          <DialogTitle>Edit Campaign</DialogTitle>
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
              <Select onValueChange={(value) => form.setValue('type', value)} value={form.watch('type')}>
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

            <div className="space-y-2">
              <Label htmlFor="reach">Actual Reach (Number of People Reached)</Label>
              <Input
                id="reach"
                type="number"
                min="0"
                {...form.register('reach')}
                placeholder="Enter actual reach achieved"
              />
              <p className="text-sm text-gray-500">Update this field after the campaign has run to record the actual number of people reached.</p>
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
              <Select onValueChange={(value) => form.setValue('status', value as any)} value={form.watch('status')}>
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
              {isLoading ? 'Updating...' : 'Update Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
