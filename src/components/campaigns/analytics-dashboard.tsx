'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Users, Heart, MessageCircle, Share, Bookmark, MousePointer, TrendingUp, Clock, Target } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

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

interface AnalyticsDashboardProps {
  campaign: Campaign
}

export function AnalyticsDashboard({ campaign }: AnalyticsDashboardProps) {
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

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Campaign Header */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-2xl break-words">{campaign.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
                <span className="text-xs sm:text-sm text-gray-500">
                  {campaign.type.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  Created {formatDate(campaign.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold truncate">{campaign.views?.toLocaleString() || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold truncate">{campaign.netFollows || 0}</p>
                <p className="text-xs sm:text-sm text-gray-600">Net Follows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {campaign.totalWatchTime ? formatTime(campaign.totalWatchTime) : '0s'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Watch Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {campaign.averageWatchTime ? formatTime(campaign.averageWatchTime) : '0s'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Avg Watch Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interaction Metrics */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Interactions</CardTitle>
        </CardHeader>
        <CardContent className="w-full overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
                <Bookmark className="h-4 w-4 text-yellow-500" />
                <span className="text-lg font-semibold">{campaign.saves || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Saves</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <MousePointer className="h-4 w-4 text-purple-500" />
                <span className="text-lg font-semibold">{campaign.linkClicks || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Link Clicks</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span className="text-lg font-semibold">{campaign.totalInteractions || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      {campaign.trafficSources && (
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <div className="space-y-3">
              {Object.entries(campaign.trafficSources as Record<string, number | string>).map(([source, percentage]) => {
                const pctNum = typeof percentage === 'number' ? percentage : Number(percentage)
                const pctSafe = Number.isFinite(pctNum) ? pctNum : 0
                return (
                <div key={source} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <span className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">{source}</span>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${pctSafe}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 w-12 sm:w-auto text-right flex-shrink-0">
                      {typeof pctSafe === 'number' ? pctSafe.toFixed(1) : String(pctSafe)}%
                    </span>
                  </div>
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience Demographics */}
      {campaign.audienceDemographics && (
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Audience Demographics</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(campaign.audienceDemographics as Record<string, number | { women?: number; men?: number }>)
                .map(([ageGroup, value]) => {
                  const isObj = typeof value === 'object' && value !== null
                  const valStr = !isObj ? String(value) : ''
                  return (
                    <div key={ageGroup} className="w-full">
                      <h4 className="font-medium text-xs sm:text-sm mb-2">{ageGroup}</h4>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {isObj ? (
                          <>
                            {(value as { women?: number }).women !== undefined && (
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-pink-500 rounded-full flex-shrink-0"></div>
                                <span className="text-xs sm:text-sm">Women: {(value as { women?: number }).women}%</span>
                              </div>
                            )}
                            {(value as { men?: number }).men !== undefined && (
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span className="text-xs sm:text-sm">Men: {(value as { men?: number }).men}%</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs sm:text-sm">{valStr}%</span>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audience Retention */}
      {campaign.audienceRetention && (
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Audience Retention</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <div className="text-xs sm:text-sm text-gray-600">
              <p>Retention data available</p>
              <pre className="mt-2 p-2 sm:p-3 bg-gray-100 rounded text-xs overflow-x-auto max-w-full">
                {JSON.stringify(campaign.audienceRetention, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
