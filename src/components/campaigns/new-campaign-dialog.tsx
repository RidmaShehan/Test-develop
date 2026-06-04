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
  // URL entered manually (optional)
  imageUrl: z
    .string()
    .url('Please enter a valid image URL')
    .optional()
    .or(z.literal('')),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
  coordinatorId: z.string().optional().nullable(),
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
  onSuccess?: () => void
}

interface CampaignType {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
}

interface UserOption {
  id: string
  name: string | null
  email: string | null
}

export function NewCampaignDialog({ open, onOpenChange, onSuccess }: NewCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([])
  // Stores uploaded image (base64 / storage output)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  // Local preview for URL-based image (so we can show a live preview even before submit)
  const [urlPreview, setUrlPreview] = useState<string | null>(null)
  const [users, setUsers] = useState<UserOption[]>([])
  
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
      fetchUsers()
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=COORDINATOR')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users for coordinators:', error)
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
      // Prefer a manually entered URL when present; otherwise fall back to uploaded image
      const finalImageUrl =
        data.imageUrl && data.imageUrl.trim() !== ''
          ? data.imageUrl.trim()
          : uploadedImage || null

      const submitData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        budget: data.budget && data.budget !== '' ? Number(data.budget) : null,
        imageUrl: finalImageUrl,
        coordinatorId: data.coordinatorId || null,
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
      setUploadedImage(null)
      setUrlPreview(null)
      onOpenChange(false)
      onSuccess?.()
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
              <Label htmlFor="coordinatorId">Coordinator</Label>
              <Select
                value={form.watch('coordinatorId') ?? undefined}
                onValueChange={(value) => form.setValue('coordinatorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email || 'Unnamed user'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Campaign Image</Label>
              <p className="text-xs text-muted-foreground mb-1">
                You can either upload an image file or paste a direct image URL. If both are provided, the URL will be used.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Upload image</Label>
                  <ImageUpload
                    value={uploadedImage}
                    onChange={setUploadedImage}
                    disabled={isLoading}
                    storageMode="base64"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-xs">
                    Or paste image URL
                  </Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/your-image.jpg"
                    {...form.register('imageUrl')}
                    onChange={(e) => {
                      form.setValue('imageUrl', e.target.value)
                      const v = e.target.value.trim()
                      // Basic check to avoid showing broken preview on empty/obviously invalid values
                      if (!v) {
                        setUrlPreview(null)
                      } else if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:')) {
                        setUrlPreview(v)
                      } else {
                        setUrlPreview(null)
                      }
                    }}
                  />
                  {form.formState.errors.imageUrl && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.imageUrl.message}
                    </p>
                  )}
                  {urlPreview && (
                    <div className="mt-2 border rounded-md overflow-hidden">
                      <img
                        src={urlPreview}
                        alt="Campaign image preview"
                        className="w-full h-40 object-cover"
                        onError={() => setUrlPreview(null)}
                      />
                    </div>
                  )}
                </div>
              </div>
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
