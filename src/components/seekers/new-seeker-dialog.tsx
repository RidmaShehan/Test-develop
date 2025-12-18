'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

const seekerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  ageBand: z.string().optional(),
  guardianPhone: z.string().optional(),
  programInterestId: z.string().optional(),
  marketingSource: z.enum(['WALK_IN', 'FB_AD', 'REFERRAL', 'WEBSITE', 'PHONE']),
  preferredContactTime: z.string().optional(),
  whatsapp: z.boolean(),
  consent: z.boolean(),
})

type SeekerFormData = z.infer<typeof seekerSchema>

interface NewSeekerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewSeekerDialog({ open, onOpenChange }: NewSeekerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<SeekerFormData>({
    resolver: zodResolver(seekerSchema),
    defaultValues: {
      whatsapp: false,
      consent: false,
    },
  })

  const onSubmit = async (data: SeekerFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/seekers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create seeker')
      }

      toast.success('Seeker created successfully')
      form.reset()
      onOpenChange(false)
      // Refresh the seekers list
      window.location.reload()
    } catch (error) {
      toast.error('Failed to create seeker')
      console.error('Error creating seeker:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Seeker</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                {...form.register('fullName')}
                placeholder="Enter full name"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-600">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="Enter phone number"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register('city')}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageBand">Age Band</Label>
              <Select onValueChange={(value) => form.setValue('ageBand', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age band" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46+">46+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                {...form.register('guardianPhone')}
                placeholder="Enter guardian phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketingSource">Marketing Source *</Label>
              <Select onValueChange={(value) => form.setValue('marketingSource', value as 'WALK_IN' | 'FB_AD' | 'REFERRAL' | 'WEBSITE' | 'PHONE')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select marketing source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WALK_IN">Walk-in</SelectItem>
                  <SelectItem value="FB_AD">Facebook Ad</SelectItem>
                  <SelectItem value="REFERRAL">Referral</SelectItem>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredContactTime">Preferred Contact Time</Label>
              <Input
                id="preferredContactTime"
                {...form.register('preferredContactTime')}
                placeholder="e.g., 9 AM - 5 PM"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whatsapp"
                checked={form.watch('whatsapp')}
                onCheckedChange={(checked) => form.setValue('whatsapp', !!checked)}
              />
              <Label htmlFor="whatsapp">Has WhatsApp</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={form.watch('consent')}
                onCheckedChange={(checked) => form.setValue('consent', !!checked)}
              />
              <Label htmlFor="consent">Consent to Contact</Label>
            </div>
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
              {isLoading ? 'Creating...' : 'Create Seeker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
