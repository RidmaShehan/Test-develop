'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  Building,
  TrendingUp,
  Target,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Deal {
  id: string
  title: string
  description?: string
  value?: number
  currency: string
  stage: string
  probability: number
  expectedCloseDate?: string
  source?: string
  createdAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  project?: {
    id: string
    name: string
    color?: string
  }
  client?: {
    id: string
    name: string
    company?: string
    email?: string
    phone?: string
  }
  _count: {
    activities: number
  }
}

interface DealPipelineProps {
  onCreateDeal?: () => void
}

const DEAL_STAGES = [
  { key: 'LEAD', label: 'Lead', color: 'bg-gray-100 text-gray-800' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  { key: 'WON', label: 'Won', color: 'bg-green-100 text-green-800' },
  { key: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-800' }
]

export function DealPipeline({ onCreateDeal }: DealPipelineProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    wonDeals: 0,
    wonValue: 0,
    averageDealSize: 0
  })

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals')
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
        
        // Calculate stats
        const totalDeals = data.length
        const totalValue = data.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0)
        const wonDeals = data.filter((deal: Deal) => deal.stage === 'WON').length
        const wonValue = data
          .filter((deal: Deal) => deal.stage === 'WON')
          .reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0)
        const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0
        
        setStats({
          totalDeals,
          totalValue,
          wonDeals,
          wonValue,
          averageDealSize
        })
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStageColor = (stage: string) => {
    const stageConfig = DEAL_STAGES.find(s => s.key === stage)
    return stageConfig?.color || 'bg-gray-100 text-gray-800'
  }

  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage)
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold">{stats.totalDeals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Won Deals</p>
                <p className="text-2xl font-bold text-green-600">{stats.wonDeals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageDealSize)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deal Pipeline</CardTitle>
          <Button onClick={onCreateDeal}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first deal to start tracking your sales pipeline.
              </p>
              <Button onClick={onCreateDeal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {DEAL_STAGES.map((stage) => {
                const stageDeals = getDealsByStage(stage.key)
                const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
                
                return (
                  <div key={stage.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{stage.label}</h3>
                      <Badge className={getStageColor(stage.key)}>
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {formatCurrency(stageValue)}
                    </div>
                    
                    <div className="space-y-2 min-h-[200px]">
                      {stageDeals.map((deal) => (
                        <Card key={deal.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{deal.title}</h4>
                              {deal.value && (
                                <span className="text-xs font-semibold text-green-600">
                                  {formatCurrency(deal.value, deal.currency)}
                                </span>
                              )}
                            </div>
                            
                            {deal.client && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building className="h-3 w-3" />
                                {deal.client.company || deal.client.name}
                              </div>
                            )}
                            
                            {deal.assignedTo && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {deal.assignedTo.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {deal.assignedTo.name}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{deal.probability}%</span>
                              <span>{formatDistanceToNow(new Date(deal.createdAt), { addSuffix: true })}</span>
                            </div>
                            
                            {deal.expectedCloseDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(deal.expectedCloseDate).toLocaleDateString()}
                              </div>
                            )}
                            
                            {deal._count.activities > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                {deal._count.activities} activities
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
