'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, RotateCcw, Trash2, Target, Users, Calendar } from 'lucide-react'
import { SocialIcon } from '@/components/ui/social-icons'
import { formatDate } from '@/lib/date-utils'
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
  isDeleted: boolean
  deletedAt: string
  createdAt: string
  _count: {
    seekers: number
  }
}

export function TrashBin() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    fetchDeletedCampaigns()
  }, [])

  const fetchDeletedCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/trash')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error('Error fetching deleted campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to restore the campaign "${campaignName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/restore`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Campaign restored successfully')
        fetchDeletedCampaigns() // Refresh the list
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to restore campaign')
      }
    } catch (error) {
      console.error('Error restoring campaign:', error)
      toast.error('Failed to restore campaign')
    }
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
      setSelectedCampaigns(filteredCampaigns.map(campaign => campaign.id))
    } else {
      setSelectedCampaigns([])
    }
  }

  const handleBulkRestore = async () => {
    if (selectedCampaigns.length === 0) return
    
    setIsRestoring(true)
    try {
      const restorePromises = selectedCampaigns.map(campaignId => 
        fetch(`/api/campaigns/${campaignId}/restore`, { method: 'POST' })
      )
      
      const results = await Promise.all(restorePromises)
      const failed = results.filter(result => !result.ok)
      
      if (failed.length === 0) {
        toast.success(`${selectedCampaigns.length} campaign(s) restored successfully`)
        setSelectedCampaigns([])
        fetchDeletedCampaigns()
      } else {
        toast.error(`Failed to restore ${failed.length} campaign(s)`)
      }
    } catch (error) {
      console.error('Error restoring campaigns:', error)
      toast.error('Failed to restore campaigns')
    } finally {
      setIsRestoring(false)
    }
  }


  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

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

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Loading deleted campaigns...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200">
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl font-semibold text-gray-900">
          <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
          <span>Deleted Campaigns</span>
          {filteredCampaigns.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs font-medium">
              {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Search and Bulk Actions */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              placeholder="Search deleted campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            {selectedCampaigns.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 flex-1 sm:flex-initial">
                <span className="text-sm text-gray-600 flex items-center px-2">
                  {selectedCampaigns.length} selected
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkRestore}
                  disabled={isRestoring}
                  className="w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {isRestoring ? 'Restoring...' : 'Restore Selected'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-md border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-50/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-900">Image</TableHead>
                <TableHead className="font-semibold text-gray-900">Campaign Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Type</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Deleted</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-gray-50/30 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    {campaign.imageUrl ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={campaign.imageUrl}
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                        <Target className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{campaign.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <SocialIcon platform="facebook" size="sm" />
                      <Badge variant="outline" className="text-xs">
                        {campaign.type.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(campaign.status)} text-xs font-medium px-2 py-0.5`}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(campaign.deletedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRestore(campaign.id, campaign.name)}
                      className="text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="pt-1">
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                    />
                  </div>

                  {/* Image */}
                  <div className="flex-shrink-0">
                    {campaign.imageUrl ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={campaign.imageUrl}
                          alt={campaign.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                        <Target className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h3 className="font-semibold text-base text-gray-900 truncate">{campaign.name}</h3>
                      {campaign.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{campaign.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1.5">
                        <SocialIcon platform="facebook" size="sm" />
                        <Badge variant="outline" className="text-xs">
                          {campaign.type.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      </div>
                      <Badge className={`${getStatusColor(campaign.status)} text-xs font-medium px-2 py-0.5`}>
                        {campaign.status}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Deleted: {formatDate(campaign.deletedAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleRestore(campaign.id, campaign.name)}
                        className="w-full sm:w-auto text-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {campaigns.length === 0 ? 'No deleted campaigns found' : 'No campaigns match your search'}
            </p>
            <p className="text-xs text-muted-foreground">
              {campaigns.length === 0 
                ? 'Deleted campaigns will appear here' 
                : 'Try adjusting your search criteria'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
