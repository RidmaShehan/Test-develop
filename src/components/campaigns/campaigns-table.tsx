'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ImageViewer } from '@/components/ui/image-viewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, Edit, Trash2, Play, Pause, Users, Target, BarChart3, Trash, FileText, Loader2 } from 'lucide-react'
import { CampaignImage } from '@/components/ui/campaign-image'
import { safeJsonParse } from '@/lib/utils'
import { SocialIcon } from '@/components/ui/social-icons'
import { formatDate } from '@/lib/date-utils'
import { EditCampaignDialog } from './edit-campaign-dialog'
import { EditReachDialog } from './edit-reach-dialog'
import { AnalyticsDialog } from './analytics-dialog'
import { toast } from 'sonner'

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

interface CampaignsTableProps {
  onViewCampaign?: (campaignId: string) => void
}

export function CampaignsTable({ onViewCampaign }: CampaignsTableProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [reachDialogOpen, setReachDialogOpen] = useState(false)
  const [editingReachCampaign, setEditingReachCampaign] = useState<Campaign | null>(null)
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false)
  const [editingAnalyticsCampaign, setEditingAnalyticsCampaign] = useState<Campaign | null>(null)
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [exportingCampaignId, setExportingCampaignId] = useState<string | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  const getSocialIcon = (typeName: string) => {
    const name = typeName.toLowerCase()
    if (name === 'facebook' || name.includes('facebook') || name.includes('fb')) {
      return <SocialIcon platform="facebook" size="sm" />
    } else if (name === 'instagram' || name.includes('instagram') || name.includes('ig')) {
      return <SocialIcon platform="instagram" size="sm" />
    } else if (name === 'tiktok' || name.includes('tiktok')) {
      return <SocialIcon platform="tiktok" size="sm" />
    } else if (name === 'youtube' || name.includes('youtube') || name.includes('yt')) {
      return <SocialIcon platform="youtube" size="sm" />
    } else if (name === 'newspaper' || name.includes('newspaper') || name.includes('news')) {
      return <SocialIcon platform="newspaper" size="sm" />
    } else if (name === 'tv_ads' || name.includes('tv') || name.includes('television')) {
      return <SocialIcon platform="tv" size="sm" />
    } else if (name === 'radio' || name.includes('radio')) {
      return <SocialIcon platform="radio" size="sm" />
    } else if (name === 'web_ads' || name.includes('web') || name.includes('online')) {
      return <SocialIcon platform="web" size="sm" />
    } else if (name === 'exhibition' || name.includes('exhibition') || name.includes('trade')) {
      return <SocialIcon platform="exhibition" size="sm" />
    } else if (name === 'friend_said' || name.includes('friend') || name.includes('referral')) {
      return <SocialIcon platform="friend" size="sm" />
    } else if (name === 'recommended' || name.includes('recommended') || name.includes('recommend')) {
      return <SocialIcon platform="recommended" size="sm" />
    }
    return null
  }

  useEffect(() => {
    setPage(1)
    setCampaigns([])
    fetchCampaigns(1, true)
  }, [searchTerm, statusFilter])

  const fetchCampaigns = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/campaigns?${params.toString()}`)
      if (response.ok) {
        const data = await safeJsonParse(response)
        if (reset) {
          setCampaigns(data.campaigns || [])
        } else {
          setCampaigns(prev => [...prev, ...(data.campaigns || [])])
        }
        setHasMore(data.pagination?.hasMore || false)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [statusFilter, searchTerm])

  // Infinite scroll observer - watch for scroll near bottom of container
  useEffect(() => {
    const container = observerTarget.current
    if (!container) return

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = container
          // Load more when user scrolls within 200px of bottom
          if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore && !loading) {
            fetchCampaigns(page + 1, false)
          }
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Also check on mount in case content doesn't fill container
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [hasMore, loadingMore, loading, page, fetchCampaigns])

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setEditDialogOpen(true)
  }

  const handleDelete = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to move the campaign "${campaignName}" to trash? You can restore it later from the trash bin.`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign moved to trash successfully')
        setPage(1)
        setCampaigns([])
        fetchCampaigns(1, true) // Refresh the list
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to move campaign to trash')
      }
    } catch (error) {
      console.error('Error moving campaign to trash:', error)
      toast.error('Failed to move campaign to trash')
    }
  }

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Campaign ${newStatus.toLowerCase()} successfully`)
        setPage(1)
        setCampaigns([])
        fetchCampaigns(1, true) // Refresh the list
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update campaign status')
      }
    } catch (error) {
      console.error('Error updating campaign status:', error)
      toast.error('Failed to update campaign status')
    }
  }

  const handleReachEdit = (campaign: Campaign) => {
    setEditingReachCampaign(campaign)
    setReachDialogOpen(true)
  }

  const handleReachSuccess = () => {
    setReachDialogOpen(false)
    setEditingReachCampaign(null)
    setPage(1)
    setCampaigns([])
    fetchCampaigns(1, true) // Refresh the list
  }

  const handleAnalyticsEdit = (campaign: Campaign) => {
    setEditingAnalyticsCampaign(campaign)
    setAnalyticsDialogOpen(true)
  }

  const handleAnalyticsSuccess = () => {
    setAnalyticsDialogOpen(false)
    setEditingAnalyticsCampaign(null)
    setPage(1)
    setCampaigns([])
    fetchCampaigns(1, true) // Refresh the list
  }

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId])
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(campaigns.map(campaign => campaign.id))
    } else {
      setSelectedCampaigns([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCampaigns.length === 0) return
    
    const campaignNames = campaigns
      .filter(campaign => selectedCampaigns.includes(campaign.id))
      .map(campaign => campaign.name)
      .join(', ')
    
    if (!confirm(`Are you sure you want to move ${selectedCampaigns.length} campaign(s) to trash: "${campaignNames}"? You can restore them later from the trash bin.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = selectedCampaigns.map(campaignId => 
        fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
      )
      
      const results = await Promise.all(deletePromises)
      const failed = results.filter(result => !result.ok)
      
      if (failed.length === 0) {
        toast.success(`${selectedCampaigns.length} campaign(s) moved to trash successfully`)
        setSelectedCampaigns([])
        setPage(1)
        setCampaigns([])
        fetchCampaigns(1, true)
      } else {
        toast.error(`Failed to move ${failed.length} campaign(s) to trash`)
      }
    } catch (error) {
      console.error('Error moving campaigns to trash:', error)
      toast.error('Failed to move campaigns to trash')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportPDF = async (campaignId: string, campaignName: string) => {
    try {
      setExportingCampaignId(campaignId)
      
      const response = await fetch(`/api/campaigns/${campaignId}/export`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${campaignName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success(`Campaign "${campaignName}" exported successfully`)
    } catch (error) {
      console.error('Error exporting campaign:', error)
      toast.error('Failed to export campaign')
    } finally {
      setExportingCampaignId(null)
    }
  }

  // No need for client-side filtering since API handles it

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
      'EMAIL': 'bg-blue-100 text-blue-800',
      'SMS': 'bg-green-100 text-green-800',
      'FACEBOOK': 'bg-blue-100 text-blue-800',
      'INSTAGRAM': 'bg-pink-100 text-pink-800',
      'NEWSPAPERS': 'bg-yellow-100 text-yellow-800',
      'TV': 'bg-purple-100 text-purple-800',
      'EDUCATION_FAIRS': 'bg-indigo-100 text-indigo-800',
      'CALL_CAMPAIGN': 'bg-orange-100 text-orange-800',
      'DIRECT_MAIL': 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading campaigns...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Campaigns</CardTitle>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2">
            <Trash2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              <strong>Trash Bin Available:</strong> Deleted campaigns are moved to the trash bin where you can restore them later. 
              <a href="/trash" className="ml-1 text-blue-600 hover:underline font-medium">View Trash Bin</a>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {selectedCampaigns.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCampaigns.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                <Trash className="h-4 w-4 mr-1" />
                {isDeleting ? 'Moving to Trash...' : 'Move to Trash'}
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div 
          ref={observerTarget}
          className="hidden lg:block rounded-md border overflow-x-auto overflow-y-auto relative w-full max-w-full"
          style={{ 
            height: '600px',
            maxHeight: 'calc(100vh - 400px)',
            minHeight: '400px'
          }}
        >
          <div className="inline-block min-w-full">
            <Table className="w-full">
            <TableHeader className="sticky top-0 bg-white z-20">
              <TableRow>
                <TableHead className="w-12 sticky left-0 bg-white z-30 border-r">
                  <Checkbox
                    checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead className="min-w-[200px] max-w-[300px]">Campaign Name</TableHead>
                <TableHead className="min-w-[120px]">Type</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[200px] max-w-[300px]">Target Audience</TableHead>
                <TableHead className="min-w-[180px] whitespace-nowrap">Duration</TableHead>
                <TableHead className="min-w-[100px]">Budget</TableHead>
                <TableHead className="min-w-[100px]">Reach</TableHead>
                <TableHead className="min-w-[120px]">Analytics</TableHead>
                <TableHead className="min-w-[120px] whitespace-nowrap">Created</TableHead>
                <TableHead className="min-w-[200px] sticky right-0 bg-white z-30 border-l">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="sticky left-0 bg-white z-20 border-r">
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <CampaignImage
                      imageUrl={campaign.imageUrl}
                      alt={campaign.name}
                      size="sm"
                      onClick={() => {
                        if (campaign.imageUrl) {
                          setSelectedImageUrl(campaign.imageUrl)
                          setImageViewerOpen(true)
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium min-w-[200px] max-w-[300px]">
                    <div className="truncate" title={campaign.name}>
                      {campaign.name}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="flex items-center space-x-2">
                      {getSocialIcon(campaign.type)}
                      <Badge className={getTypeColor(campaign.type)}>
                        <span className="truncate max-w-[80px] block">
                        {campaign.type.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[200px] max-w-[300px]">
                    <div className="truncate" title={campaign.targetAudience}>
                      {campaign.targetAudience}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[180px] whitespace-nowrap">
                    <div className="text-sm">
                    {formatDate(campaign.startDate)}
                      {campaign.endDate && (
                        <span className="text-gray-500"> - {formatDate(campaign.endDate)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[100px] whitespace-nowrap">
                    {campaign.budget ? `$${campaign.budget.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-xs whitespace-nowrap"
                        onClick={() => handleReachEdit(campaign)}
                      >
                        {campaign.reach ? campaign.reach.toLocaleString() : 'Set'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm whitespace-nowrap truncate"
                        onClick={() => handleAnalyticsEdit(campaign)}
                        title={campaign.views ? `${campaign.views} views` : 'Add analytics'}
                      >
                        {campaign.views ? `${campaign.views} views` : 'Add analytics'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[120px] whitespace-nowrap">
                    <div className="text-sm">
                    {formatDate(campaign.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[200px] sticky right-0 bg-white z-20 border-l">
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onViewCampaign?.(campaign.id)}
                        title="View campaign details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(campaign)}
                        title="Edit campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleExportPDF(campaign.id, campaign.name)}
                        disabled={exportingCampaignId === campaign.id}
                        title="Export to PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'ACTIVE' ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
                          title="Pause campaign"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : campaign.status === 'DRAFT' || campaign.status === 'PAUSED' ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                          title="Activate campaign"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(campaign.id, campaign.name)}
                        title="Move to trash bin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Infinite Scroll Loading Indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-4 sticky bottom-0 bg-white border-t">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-600">Loading more campaigns...</span>
            </div>
          )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex flex-col">
                {/* Checkbox Row */}
                <div className="flex items-center mb-3">
                  <Checkbox
                    checked={selectedCampaigns.includes(campaign.id)}
                    onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                  />
                </div>
                {/* Centered Image */}
                <div className="flex justify-center mb-3">
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
                    containerClassName="mx-auto"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate text-center sm:text-left w-full sm:w-auto">{campaign.name}</h3>
                    <div className="flex space-x-1 ml-0 sm:ml-2 flex-shrink-0 mt-2 sm:mt-0">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onViewCampaign?.(campaign.id)}
                        title="View"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(campaign)}
                        title="Edit"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getSocialIcon(campaign.type)}
                      <Badge className={getTypeColor(campaign.type)}>
                        {campaign.type.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 text-center sm:text-left">
                    <div><strong>Audience:</strong> {campaign.targetAudience}</div>
                    <div><strong>Duration:</strong> {formatDate(campaign.startDate)}{campaign.endDate && ` - ${formatDate(campaign.endDate)}`}</div>
                    {campaign.budget && <div><strong>Budget:</strong> ${campaign.budget.toLocaleString()}</div>}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span 
                        className="cursor-pointer text-blue-600 hover:underline"
                        onClick={() => handleReachEdit(campaign)}
                      >
                        <Users className="h-3 w-3 inline mr-1" />
                        Reach: {campaign.reach ? campaign.reach.toLocaleString() : 'Set'}
                      </span>
                      <span 
                        className="cursor-pointer text-blue-600 hover:underline"
                        onClick={() => handleAnalyticsEdit(campaign)}
                      >
                        <BarChart3 className="h-3 w-3 inline mr-1" />
                        {campaign.views ? `${campaign.views} views` : 'Analytics'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2 pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleExportPDF(campaign.id, campaign.name)}
                      disabled={exportingCampaignId === campaign.id}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    {campaign.status === 'ACTIVE' ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    ) : campaign.status === 'DRAFT' || campaign.status === 'PAUSED' ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    ) : null}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 text-xs text-red-600"
                      onClick={() => handleDelete(campaign.id, campaign.name)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>


        {campaigns.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No campaigns found matching your criteria.
            <br />
            <span className="text-sm text-gray-400">
              Deleted campaigns can be found in the <a href="/trash" className="text-blue-600 hover:underline">Trash Bin</a>.
            </span>
          </div>
        )}
      </CardContent>
      
      <EditCampaignDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        campaign={editingCampaign}
        onSuccess={fetchCampaigns}
      />
      
      <EditReachDialog
        open={reachDialogOpen}
        onOpenChange={setReachDialogOpen}
        campaign={editingReachCampaign}
        onSuccess={handleReachSuccess}
      />
      
      <AnalyticsDialog
        open={analyticsDialogOpen}
        onOpenChange={setAnalyticsDialogOpen}
        campaign={editingAnalyticsCampaign}
        onSuccess={handleAnalyticsSuccess}
      />
      
      {selectedImageUrl && (
        <ImageViewer
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
          imageUrl={selectedImageUrl}
          alt="Campaign image"
        />
      )}
    </Card>
  )
}
