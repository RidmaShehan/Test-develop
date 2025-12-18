'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, X, Plus, Trash2 } from 'lucide-react'

interface Program {
  id: string
  name: string
  campus: string
}

interface Campaign {
  id: string
  name: string
  type: string
}

interface User {
  id: string
  name: string
  email: string
}

interface NewPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

export function NewPostDialog({ open, onOpenChange, onPostCreated }: NewPostDialogProps) {
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    caption: '',
    imageUrl: '',
    budget: '',
    startDate: '',
    endDate: '',
    programId: '',
    campaignId: '',
    approvers: [] as string[],
  })

  useEffect(() => {
    if (open) {
      fetchPrograms()
      fetchCampaigns()
      fetchUsers()
    }
  }, [open])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setLoading(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'posts')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, imageUrl: data.url }))
        setImagePreview(URL.createObjectURL(file))
        toast.success('Image uploaded successfully')
      } else {
        toast.error('Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }))
    setImagePreview(null)
  }

  const handleAddApprover = () => {
    // Show message to select approver
    if (formData.approvers.length >= 5) {
      toast.error('Maximum 5 approvers allowed')
      return
    }
  }

  const handleRemoveApprover = (index: number) => {
    setFormData(prev => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index),
    }))
  }

  const handleApproverChange = (index: number, userId: string) => {
    setFormData(prev => {
      const newApprovers = [...prev.approvers]
      newApprovers[index] = userId
      return { ...prev, approvers: newApprovers }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.caption.trim()) {
      toast.error('Please enter a caption')
      return
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select campaign duration')
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date')
      return
    }

    if (formData.approvers.length === 0) {
      toast.error('Please add at least one approver')
      return
    }

    // Check for duplicate approvers
    const uniqueApprovers = new Set(formData.approvers)
    if (uniqueApprovers.size !== formData.approvers.length) {
      toast.error('Duplicate approvers are not allowed')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption: formData.caption,
          imageUrl: formData.imageUrl,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          programId: formData.programId || null,
          campaignId: formData.campaignId || null,
          approvers: formData.approvers,
        }),
      })

      if (response.ok) {
        toast.success('Post created successfully and sent for approval')
        onPostCreated?.()
        onOpenChange(false)
        setFormData({
          caption: '',
          imageUrl: '',
          budget: '',
          startDate: '',
          endDate: '',
          programId: '',
          campaignId: '',
          approvers: [],
        })
        setImagePreview(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Post for Approval</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a social media post and submit it for approval through the approval chain
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 py-4">
            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption" className="text-base font-medium">
                Caption <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Write your post caption here..."
                rows={4}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.caption.length} characters
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Image</Label>
              {!imagePreview ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Program & Campaign Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program">Program (Optional)</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} - {program.campus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Select
                  value={formData.campaignId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, campaignId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget & Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Approval Chain */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Approval Chain <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, approvers: [...prev.approvers, ''] }))}
                  disabled={formData.approvers.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Approver
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Add approvers in order. Each must approve before the next can review.
              </p>

              <div className="space-y-3">
                {formData.approvers.map((approverId, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <Select
                      value={approverId}
                      onValueChange={(value) => handleApproverChange(index, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={`Select ${index === 0 ? 'first' : index === 1 ? 'second' : `${index + 1}th`} approver`} />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(u => !formData.approvers.includes(u.id) || u.id === approverId)
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveApprover(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                {formData.approvers.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No approvers added yet. Click "Add Approver" to begin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create & Submit for Approval'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

