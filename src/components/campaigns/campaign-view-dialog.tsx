'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Users, 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  MousePointer, 
  TrendingUp, 
  Clock, 
  Target,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { AnalyticsDashboard } from './analytics-dashboard'
import { toast } from 'sonner'
import { ImageViewer } from '@/components/ui/image-viewer'
import { CampaignImage } from '@/components/ui/campaign-image'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  type: string
  targetAudience: string
  startDate: string
  endDate?: string
  budget?: number
  reach?: number
  imageUrl?: string
  // Analytics fields
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
  _count: {
    seekers: number
  }
}

interface CampaignViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string | null
}

export function CampaignViewDialog({ open, onOpenChange, campaignId }: CampaignViewDialogProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data)
      } else {
        const result = await response.json().catch(() => ({}))
        if (response.status === 404) {
          toast.error('Campaign not found')
        } else if (response.status === 403) {
          toast.error('You do not have permission to view this campaign')
        } else {
          toast.error(result?.error || 'Failed to fetch campaign')
        }
        setCampaign(null)
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
      toast.error('Failed to load campaign. Please try again.')
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaign()
    }
  }, [open, campaignId, fetchCampaign])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'PAUSED': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'FACEBOOK': 'bg-blue-100 text-blue-800',
      'INSTAGRAM': 'bg-pink-100 text-pink-800',
      'TWITTER': 'bg-sky-100 text-sky-800',
      'LINKEDIN': 'bg-blue-100 text-blue-800',
      'YOUTUBE': 'bg-red-100 text-red-800',
      'TIKTOK': 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Campaign</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading campaign...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!campaign) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Not Found</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">Campaign not found</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Campaign Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
            {/* Campaign Header */}
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 space-x-0 sm:space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <CampaignImage
                      imageUrl={campaign.imageUrl}
                      alt={campaign.name}
                      size="md"
                      onClick={() => {
                        if (campaign.imageUrl) {
                          setSelectedImageUrl(campaign.imageUrl)
                          setImageViewerOpen(true)
                        }
                      }}
                      containerClassName="mx-auto sm:mx-0"
                    />
                    <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                      <CardTitle className="text-lg sm:text-2xl break-words">{campaign.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <Badge className={getTypeColor(campaign.type)}>
                          {campaign.type.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Created {formatDate(campaign.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Campaign Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-hidden">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm break-words">{campaign.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Target Audience</label>
                    <p className="mt-1 text-sm break-words">{campaign.targetAudience}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="mt-1 text-sm">{formatDate(campaign.startDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="mt-1 text-sm">{campaign.endDate ? formatDate(campaign.endDate) : 'No end date'}</p>
                    </div>
                  </div>
                  {campaign.budget && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Budget</label>
                      <p className="mt-1 text-sm flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {campaign.budget.toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{campaign.views?.toLocaleString() || 0}</div>
                      <div className="text-sm text-blue-600">Total Views</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{campaign._count?.seekers || 0}</div>
                      <div className="text-sm text-green-600">Leads Generated</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {campaign.totalWatchTime ? formatTime(campaign.totalWatchTime) : '0s'}
                      </div>
                      <div className="text-sm text-purple-600">Total Watch Time</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{campaign.totalInteractions || 0}</div>
                      <div className="text-sm text-orange-600">Total Interactions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-lg font-semibold">{campaign.reactions || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600">Reactions</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-lg font-semibold">{campaign.comments || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600">Comments</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Share className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-semibold">{campaign.shares || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600">Shares</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <MousePointer className="h-4 w-4 text-purple-500" />
                      <span className="text-lg font-semibold">{campaign.linkClicks || 0}</span>
                    </div>
                    <p className="text-sm text-gray-600">Link Clicks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {campaign && <AnalyticsDashboard campaign={campaign} />}
          </TabsContent>
        </Tabs>
        
        {selectedImageUrl && (
          <ImageViewer
            open={imageViewerOpen}
            onOpenChange={setImageViewerOpen}
            imageUrl={selectedImageUrl}
            alt={campaign?.name || 'Campaign image'}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
