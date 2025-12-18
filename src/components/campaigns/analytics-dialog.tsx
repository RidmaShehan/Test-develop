'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsDashboard } from './analytics-dashboard'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { safeJsonParse } from '@/lib/utils'

const analyticsSchema = z.object({
  // Basic metrics
  views: z.string().optional(),
  netFollows: z.string().optional(),
  totalWatchTime: z.string().optional(),
  averageWatchTime: z.string().optional(),
  
  // Interaction metrics
  totalInteractions: z.string().optional(),
  reactions: z.string().optional(),
  comments: z.string().optional(),
  shares: z.string().optional(),
  saves: z.string().optional(),
  linkClicks: z.string().optional(),
  
  // JSON data fields
  audienceRetention: z.string().optional(),
  trafficSources: z.string().optional(),
  audienceDemographics: z.string().optional(),
})

type AnalyticsFormData = z.infer<typeof analyticsSchema>

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  views?: number
  netFollows?: number
  totalWatchTime?: number
  averageWatchTime?: number
  audienceRetention?: any
  totalInteractions?: number
  reactions?: number
  comments?: number
  shares?: number
  saves?: number
  linkClicks?: number
  trafficSources?: any
  audienceDemographics?: any
  createdAt: string
}

interface AnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  onSuccess: () => void
}

export function AnalyticsDialog({ open, onOpenChange, campaign, onSuccess }: AnalyticsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit')
  const [isClearing, setIsClearing] = useState(false)
  
  const form = useForm<AnalyticsFormData>({
    resolver: zodResolver(analyticsSchema),
    defaultValues: {
      views: '',
      netFollows: '',
      totalWatchTime: '',
      averageWatchTime: '',
      totalInteractions: '',
      reactions: '',
      comments: '',
      shares: '',
      saves: '',
      linkClicks: '',
      audienceRetention: '',
      trafficSources: '',
      audienceDemographics: '',
    },
  })

  // Update form when campaign changes
  useEffect(() => {
    if (campaign) {
      form.reset({
        views: campaign.views?.toString() || '',
        netFollows: campaign.netFollows?.toString() || '',
        totalWatchTime: campaign.totalWatchTime?.toString() || '',
        averageWatchTime: campaign.averageWatchTime?.toString() || '',
        totalInteractions: campaign.totalInteractions?.toString() || '',
        reactions: campaign.reactions?.toString() || '',
        comments: campaign.comments?.toString() || '',
        shares: campaign.shares?.toString() || '',
        saves: campaign.saves?.toString() || '',
        linkClicks: campaign.linkClicks?.toString() || '',
        audienceRetention: campaign.audienceRetention ? JSON.stringify(campaign.audienceRetention, null, 2) : '',
        trafficSources: campaign.trafficSources ? JSON.stringify(campaign.trafficSources, null, 2) : '',
        audienceDemographics: campaign.audienceDemographics ? JSON.stringify(campaign.audienceDemographics, null, 2) : '',
      })
    }
  }, [campaign, form])

  const onSubmit = async (data: AnalyticsFormData) => {
    if (!campaign) return
    
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // Parse JSON fields
      let audienceRetention = null
      let trafficSources = null
      let audienceDemographics = null
      
      try {
        if (data.audienceRetention) {
          audienceRetention = JSON.parse(data.audienceRetention)
        }
        if (data.trafficSources) {
          trafficSources = JSON.parse(data.trafficSources)
        }
        if (data.audienceDemographics) {
          audienceDemographics = JSON.parse(data.audienceDemographics)
        }
      } catch (error) {
        toast.error('Invalid JSON format in one of the data fields')
        return
      }

      const updateData = {
        views: data.views ? parseInt(data.views) : null,
        netFollows: data.netFollows ? parseInt(data.netFollows) : null,
        totalWatchTime: data.totalWatchTime ? parseInt(data.totalWatchTime) : null,
        averageWatchTime: data.averageWatchTime ? parseInt(data.averageWatchTime) : null,
        totalInteractions: data.totalInteractions ? parseInt(data.totalInteractions) : null,
        reactions: data.reactions ? parseInt(data.reactions) : null,
        comments: data.comments ? parseInt(data.comments) : null,
        shares: data.shares ? parseInt(data.shares) : null,
        saves: data.saves ? parseInt(data.saves) : null,
        linkClicks: data.linkClicks ? parseInt(data.linkClicks) : null,
        audienceRetention,
        trafficSources,
        audienceDemographics,
      }
      
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await safeJsonParse(response)

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to update analytics')
          return
        }
        if (response.status === 400) {
          const errorMessage = result?.error || result?.details || 'Please check your data'
          toast.error(errorMessage)
          return
        }
        if (response.status === 500) {
          const errorMessage = result?.error || result?.details || 'Server error occurred'
          toast.error(errorMessage)
          return
        }
        
        throw new Error(result?.error || result?.details || 'Failed to update analytics')
      }

      toast.success('Analytics updated successfully')
      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating analytics:', error)
      
      if (error instanceof Error && error.message === 'Invalid response from server') {
        toast.error('Server returned invalid response')
      } else if (error instanceof Error && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update analytics'
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAnalytics = async () => {
    if (!campaign) return
    
    if (!confirm('Are you sure you want to clear all analytics data for this campaign? This will reset all analytics metrics to zero.')) {
      return
    }
    
    setIsClearing(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          views: null,
          netFollows: null,
          totalWatchTime: null,
          averageWatchTime: null,
          audienceRetention: null,
          totalInteractions: null,
          reactions: null,
          comments: null,
          shares: null,
          saves: null,
          linkClicks: null,
          trafficSources: null,
          audienceDemographics: null,
        }),
      })

      const result = await safeJsonParse(response)

      if (!response.ok) {
        throw new Error(result?.error || result?.details || 'Failed to clear analytics')
      }

      toast.success('Analytics data cleared successfully')
      onSuccess()
    } catch (error) {
      console.error('Error clearing analytics:', error)
      toast.error('Failed to clear analytics data')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Campaign Analytics</DialogTitle>
          {campaign && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-2">
              <p className="text-xs sm:text-sm text-gray-600 break-words flex-1 min-w-0">
                <strong>Campaign:</strong> {campaign.name}
              </p>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant={viewMode === 'view' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('view')}
                >
                  View Analytics
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'edit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('edit')}
                >
                  Edit Analytics
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAnalytics}
                  disabled={isClearing}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isClearing ? 'Clearing...' : 'Clear Analytics'}
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>
        
        {viewMode === 'view' && campaign ? (
          <AnalyticsDashboard campaign={campaign} />
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic</TabsTrigger>
              <TabsTrigger value="interactions" className="text-xs sm:text-sm">Interactions</TabsTrigger>
              <TabsTrigger value="traffic" className="text-xs sm:text-sm">Traffic</TabsTrigger>
              <TabsTrigger value="demographics" className="text-xs sm:text-sm">Demographics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Basic Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="views" className="text-xs sm:text-sm">Total Views</Label>
                      <Input
                        id="views"
                        type="number"
                        min="0"
                        {...form.register('views')}
                        placeholder="Enter total views"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="netFollows">Net Follows</Label>
                      <Input
                        id="netFollows"
                        type="number"
                        {...form.register('netFollows')}
                        placeholder="Enter net follows"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalWatchTime">Total Watch Time (seconds)</Label>
                      <Input
                        id="totalWatchTime"
                        type="number"
                        min="0"
                        {...form.register('totalWatchTime')}
                        placeholder="Enter total watch time in seconds"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="averageWatchTime">Average Watch Time (seconds)</Label>
                      <Input
                        id="averageWatchTime"
                        type="number"
                        min="0"
                        {...form.register('averageWatchTime')}
                        placeholder="Enter average watch time in seconds"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audienceRetention">Audience Retention Data (JSON)</Label>
                    <Textarea
                      id="audienceRetention"
                      {...form.register('audienceRetention')}
                      placeholder='{"retentionPoints": [100, 80, 60, 40, 20], "timePoints": [0, 4, 8, 16, 32]}'
                      rows={4}
                    />
                    <p className="text-sm text-gray-500">Enter retention data as JSON format</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="interactions" className="space-y-4">
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Interaction Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalInteractions" className="text-xs sm:text-sm">Total Interactions</Label>
                      <Input
                        id="totalInteractions"
                        type="number"
                        min="0"
                        {...form.register('totalInteractions')}
                        placeholder="Enter total interactions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reactions" className="text-xs sm:text-sm">Reactions</Label>
                      <Input
                        id="reactions"
                        type="number"
                        min="0"
                        {...form.register('reactions')}
                        placeholder="Enter total reactions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comments" className="text-xs sm:text-sm">Comments</Label>
                      <Input
                        id="comments"
                        type="number"
                        min="0"
                        {...form.register('comments')}
                        placeholder="Enter total comments"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shares" className="text-xs sm:text-sm">Shares</Label>
                      <Input
                        id="shares"
                        type="number"
                        min="0"
                        {...form.register('shares')}
                        placeholder="Enter total shares"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saves" className="text-xs sm:text-sm">Saves</Label>
                      <Input
                        id="saves"
                        type="number"
                        min="0"
                        {...form.register('saves')}
                        placeholder="Enter total saves"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkClicks" className="text-xs sm:text-sm">Link Clicks</Label>
                      <Input
                        id="linkClicks"
                        type="number"
                        min="0"
                        {...form.register('linkClicks')}
                        placeholder="Enter total link clicks"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="traffic" className="space-y-4">
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trafficSources" className="text-xs sm:text-sm">Traffic Source Data (JSON)</Label>
                    <Textarea
                      id="trafficSources"
                      {...form.register('trafficSources')}
                      placeholder='{"Your Page": 46, "Other": 21.4, "Home tab": 16.4, "Video tab": 16.1, "Groups": 0.1}'
                      rows={6}
                    />
                    <p className="text-sm text-gray-500">Enter traffic source percentages as JSON format</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="demographics" className="space-y-4">
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Audience Demographics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audienceDemographics" className="text-xs sm:text-sm">Demographics Data (JSON)</Label>
                    <Textarea
                      id="audienceDemographics"
                      {...form.register('audienceDemographics')}
                      placeholder='{"25-34": {"women": 45, "men": 10}, "18-24": {"women": 21, "men": 5}}'
                      rows={8}
                    />
                    <p className="text-sm text-gray-500">Enter age/gender demographics as JSON format</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Updating...' : 'Update Analytics'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
