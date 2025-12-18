'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { SocialIcon } from '@/components/ui/social-icons'
import { formatDate } from '@/lib/date-utils'

interface CampaignType {
  id: string
  name: string
  description?: string
  color?: string
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

interface CampaignTypeViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignType: CampaignType | null
}

export function CampaignTypeViewDialog({ open, onOpenChange, campaignType }: CampaignTypeViewDialogProps) {
  if (!campaignType) return null

  const getSocialIcon = (typeName: string) => {
    const name = typeName.toLowerCase()
    if (name === 'facebook' || name.includes('facebook') || name.includes('fb')) {
      return <SocialIcon platform="facebook" size="md" />
    } else if (name === 'instagram' || name.includes('instagram') || name.includes('ig')) {
      return <SocialIcon platform="instagram" size="md" />
    } else if (name === 'tiktok' || name.includes('tiktok')) {
      return <SocialIcon platform="tiktok" size="md" />
    } else if (name === 'youtube' || name.includes('youtube') || name.includes('yt')) {
      return <SocialIcon platform="youtube" size="md" />
    } else if (name === 'newspaper' || name.includes('newspaper') || name.includes('news')) {
      return <SocialIcon platform="newspaper" size="md" />
    } else if (name === 'tv_ads' || name.includes('tv') || name.includes('television')) {
      return <SocialIcon platform="tv" size="md" />
    } else if (name === 'radio' || name.includes('radio')) {
      return <SocialIcon platform="radio" size="md" />
    } else if (name === 'web_ads' || name.includes('web') || name.includes('online')) {
      return <SocialIcon platform="web" size="md" />
    } else if (name === 'exhibition' || name.includes('exhibition') || name.includes('trade')) {
      return <SocialIcon platform="exhibition" size="md" />
    } else if (name === 'friend_said' || name.includes('friend') || name.includes('referral')) {
      return <SocialIcon platform="friend" size="md" />
    } else if (name === 'recommended' || name.includes('recommended') || name.includes('recommend')) {
      return <SocialIcon platform="recommended" size="md" />
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {getSocialIcon(campaignType.name)}
            <span>Campaign Type Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <div className="flex items-center space-x-2 mt-1">
                  {getSocialIcon(campaignType.name)}
                  <span className="text-lg font-semibold">{campaignType.name}</span>
                  {campaignType.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge className={campaignType.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {campaignType.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Color</label>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: campaignType.color || '#6B7280' }}
                  />
                  <span className="text-sm text-gray-600">{campaignType.color || '#6B7280'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Campaigns Count</label>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {campaignType._count.campaigns}
                </div>
                <p className="text-sm text-gray-500">Total campaigns using this type</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <div className="text-sm text-gray-600 mt-1">
                  {formatDate(campaignType.createdAt)}
                </div>
              </div>

              {campaignType.createdBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <div className="text-sm text-gray-600 mt-1">
                    {campaignType.createdBy.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {campaignType.createdBy.email}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {campaignType.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{campaignType.description}</p>
              </div>
            </div>
          )}

          {/* Campaign Type Category */}
          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <div className="mt-1">
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  backgroundColor: campaignType.color ? `${campaignType.color}20` : '#6B728020',
                  borderColor: campaignType.color || '#6B7280',
                  color: campaignType.color || '#6B7280'
                }}
              >
                {campaignType.name.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
