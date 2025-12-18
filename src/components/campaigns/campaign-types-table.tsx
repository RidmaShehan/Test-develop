'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Edit, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { SocialIcon } from '@/components/ui/social-icons'
import { formatDate } from '@/lib/date-utils'
import { EditCampaignTypeDialog } from './edit-campaign-type-dialog'
import { NewCampaignTypeDialog } from './new-campaign-type-dialog'
import { CampaignTypeViewDialog } from './campaign-type-view-dialog'
import { toast } from 'sonner'

interface CampaignType {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  isDefault: boolean
  createdAt: string
  createdBy?: {
    id: string
    name: string
    email: string
  }
  _count: {
    campaigns: number
  }
}

export function CampaignTypesTable() {
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingType, setEditingType] = useState<CampaignType | null>(null)
  const [viewingType, setViewingType] = useState<CampaignType | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [newDialogOpen, setNewDialogOpen] = useState(false)

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
    fetchCampaignTypes()
  }, [])

  const fetchCampaignTypes = async () => {
    try {
      const response = await fetch('/api/campaign-types')
      if (response.ok) {
        const data = await response.json()
        setCampaignTypes(data)
      }
    } catch (error) {
      console.error('Error fetching campaign types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (type: CampaignType) => {
    setViewingType(type)
    setViewDialogOpen(true)
  }

  const handleEdit = (type: CampaignType) => {
    setEditingType(type)
    setEditDialogOpen(true)
  }

  const handleToggleActive = async (type: CampaignType) => {
    try {
      const response = await fetch(`/api/campaign-types/${type.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !type.isActive })
      })

      if (response.ok) {
        toast.success(`Campaign type ${!type.isActive ? 'activated' : 'deactivated'}`)
        fetchCampaignTypes()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error toggling campaign type status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this campaign type?')) {
      return
    }

    try {
      const response = await fetch(`/api/campaign-types/${typeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign type deleted successfully')
        fetchCampaignTypes() // Refresh the list
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete campaign type')
      }
    } catch (error) {
      console.error('Error deleting campaign type:', error)
      toast.error('Failed to delete campaign type')
    }
  }

  const filteredTypes = campaignTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && type.isActive) ||
                         (statusFilter === 'inactive' && !type.isActive)
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  // removed type pill renderer as per request

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading campaign types...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Campaign Types</CardTitle>
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search campaign types..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Campaigns</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getSocialIcon(type.name)}
                      <span>{type.name}</span>
                      {type.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{type.description || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(type.isActive)}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span>{type._count.campaigns}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(type.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleActive(type)}
                      title={type.isActive ? 'Set inactive' : 'Set active'}
                    >
                      {type.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleView(type)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!type.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredTypes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No campaign types found matching your criteria.
          </div>
        )}
      </CardContent>
      
      <EditCampaignTypeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        campaignType={editingType}
        onSuccess={fetchCampaignTypes}
      />
      
      <NewCampaignTypeDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={fetchCampaignTypes}
      />

      <CampaignTypeViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        campaignType={viewingType}
      />
    </Card>
  )
}
