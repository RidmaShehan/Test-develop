'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CampaignsTable } from './campaigns-table'
import { CampaignTypesTable } from './campaign-types-table'
import { NewCampaignButton } from './new-campaign-button'
import { CampaignViewDialog } from './campaign-view-dialog'
import { ImageViewer } from '@/components/ui/image-viewer'
import { safeJsonParse } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import { Plus, BarChart3, Users, Target, TrendingUp, Tag, Eye, FileSpreadsheet } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
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
  createdAt: string
  _count: {
    seekers: number
  }
}

export function CampaignsDashboard() {
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('all')
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [exportingAll, setExportingAll] = useState(false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  // Stats calculations
  const totalCampaigns = allCampaigns.length
  const activeCampaigns = allCampaigns.filter(campaign => campaign.status === 'ACTIVE').length
  const totalSeekers = allCampaigns.reduce((sum, campaign) => sum + (campaign._count.seekers || 0), 0)
  const totalReach = allCampaigns.reduce((sum, campaign) => sum + (campaign.reach || 0), 0)
  const conversionRate = totalReach > 0 ? ((totalSeekers / totalReach) * 100).toFixed(2) : '0.00'

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      // Fetch first page for recent campaigns display
      const response = await fetch('/api/campaigns?page=1&limit=20')
      if (response.ok) {
        const data = await safeJsonParse(response)
        // Handle new paginated response structure
        const campaigns = data.campaigns || (Array.isArray(data) ? data : [])
        setAllCampaigns(campaigns)
        // Get the 3 most recent campaigns
        setRecentCampaigns(campaigns.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setViewDialogOpen(true)
  }

  const handleExportAll = async () => {
    try {
      setExportingAll(true)
      
      const response = await fetch('/api/campaigns/export-all')
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `all-campaigns-report-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      // Show success message
      alert(`All campaigns exported successfully! Total: ${allCampaigns.length} campaigns`)
    } catch (error) {
      console.error('Error exporting all campaigns:', error)
      alert('Failed to export campaigns. Please try again.')
    } finally {
      setExportingAll(false)
    }
  }


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
              <p className="text-muted-foreground">
                Manage your marketing campaigns and track their performance
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleExportAll}
                variant="outline"
                size="default"
                disabled={exportingAll || allCampaigns.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {exportingAll ? 'Exporting...' : 'Export All to Excel'}
              </Button>
              {hasPermission('CREATE_CAMPAIGN') && (
                <NewCampaignButton />
              )}
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : totalCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              All time campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : activeCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : totalReach.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total reach across all campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${conversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns with Thumbnails */}
      {recentCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Recent Campaigns</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 justify-items-center sm:justify-items-stretch">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow w-full max-w-sm sm:max-w-none">
                  <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-3 sm:space-y-0 space-x-0 sm:space-x-3">
                    {/* Campaign Thumbnail - Centered */}
                    <div className="flex-shrink-0 flex justify-center sm:justify-start">
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
                    
                    {/* Campaign Info - Centered on mobile */}
                    <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                      <h3 className="font-medium text-sm truncate">{campaign.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{campaign.targetAudience}</p>
                      
                      <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                        <Badge 
                          className={`text-xs ${
                            campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {campaign.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(campaign.startDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center sm:justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {campaign._count?.seekers || 0} leads
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2"
                          onClick={() => handleViewCampaign(campaign.id)}
                          title="View campaign details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Campaigns and Campaign Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="types">Campaign Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4 overflow-x-hidden">
          <Card className="overflow-x-hidden">
            <CardHeader>
              <CardTitle>All Campaigns</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-hidden">
              <CampaignsTable onViewCampaign={handleViewCampaign} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="types" className="space-y-4">
          <CampaignTypesTable />
        </TabsContent>
      </Tabs>

          {/* Campaign View Dialog */}
          <CampaignViewDialog 
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            campaignId={selectedCampaignId}
          />
          
          {/* Image Viewer */}
          {selectedImageUrl && (
            <ImageViewer
              open={imageViewerOpen}
              onOpenChange={setImageViewerOpen}
              imageUrl={selectedImageUrl}
              alt="Campaign image"
            />
          )}
        </div>
      </div>

    </div>
  )
}
