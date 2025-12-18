'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Search, Filter, X, User, GraduationCap, Megaphone, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Inquiry {
  id: string
  fullName: string
  phone: string
  email?: string
  city?: string
  ageBand?: string
  preferredContactTime?: string
  preferredStatus?: number
  followUpAgain?: boolean
  description?: string
  whatsapp: boolean
  consent: boolean
  stage: string
  marketingSource: string
  createdAt: string
  programInterest?: {
    id: string
    name: string
    level: string
    campus: string
  }
  preferredPrograms?: {
    id: string
    program: {
      id: string
      name: string
      level: string
      campus: string
    }
  }[]
  campaigns?: {
    id: string
    campaign: {
      id: string
      name: string
      type: string
    }
  }[]
  createdBy?: {
    name: string
  }
}

interface InquirySearchFilterProps {
  inquiries: Inquiry[]
  programs: any[]
  campaigns: any[]
  onFilteredInquiries: (filteredInquiries: Inquiry[]) => void
  className?: string
}

interface FilterState {
  searchQuery: string
  stages: string[]
  programs: string[]
  campaigns: string[]
  marketingSources: string[]
  ageBands: string[]
  cities: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  followUpRequired: boolean | null
  hasWhatsapp: boolean | null
  showRecent: boolean
}

const stageOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'ATTEMPTING_CONTACT', label: 'Attempting Contact' },
  { value: 'CONNECTED', label: 'Connected' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'COUNSELING_SCHEDULED', label: 'Counseling Scheduled' },
  { value: 'CONSIDERING', label: 'Considering' },
  { value: 'READY_TO_REGISTER', label: 'Ready to Register' },
  { value: 'LOST', label: 'Lost' },
]

const ageBandOptions = [
  '16-18', '19-21', '22-25', '26-30', '31-35', '36-40', '41-45', '46-50', '51+'
]

export function InquirySearchFilter({ inquiries, programs, campaigns, onFilteredInquiries, className }: InquirySearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    stages: [],
    programs: [],
    campaigns: [],
    marketingSources: [],
    ageBands: [],
    cities: [],
    dateRange: {},
    followUpRequired: null,
    hasWhatsapp: null,
    showRecent: false,
  })

  const [showFilters, setShowFilters] = useState(false)

  // Get unique values from inquiries for filter options
  const uniqueMarketingSources = useMemo(() => {
    const sources = inquiries.map(inquiry => inquiry.marketingSource)
    return Array.from(new Set(sources))
  }, [inquiries])

  const uniqueCities = useMemo(() => {
    const cities = inquiries.map(inquiry => inquiry.city).filter(Boolean) as string[]
    return Array.from(new Set(cities))
  }, [inquiries])

  // Filter inquiries based on current filters
  const filteredInquiries = useMemo(() => {
    let filtered = [...inquiries]

    // Universal search across all fields
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(inquiry => 
        inquiry.fullName.toLowerCase().includes(query) ||
        inquiry.phone.includes(query) ||
        inquiry.email?.toLowerCase().includes(query) ||
        inquiry.city?.toLowerCase().includes(query) ||
        inquiry.description?.toLowerCase().includes(query) ||
        inquiry.programInterest?.name.toLowerCase().includes(query) ||
        inquiry.preferredPrograms?.some(p => p.program.name.toLowerCase().includes(query)) ||
        inquiry.campaigns?.some(c => c.campaign.name.toLowerCase().includes(query)) ||
        inquiry.marketingSource.toLowerCase().includes(query) ||
        inquiry.stage.toLowerCase().includes(query)
      )
    }

    // Stage filter
    if (filters.stages.length > 0) {
      filtered = filtered.filter(inquiry => filters.stages.includes(inquiry.stage))
    }

    // Program filter
    if (filters.programs.length > 0) {
      filtered = filtered.filter(inquiry => {
        const inquiryPrograms = [
          inquiry.programInterest?.id,
          ...(inquiry.preferredPrograms?.map(p => p.program.id) || [])
        ].filter(Boolean) as string[]
        return inquiryPrograms.some(programId => filters.programs.includes(programId))
      })
    }

    // Campaign filter
    if (filters.campaigns.length > 0) {
      filtered = filtered.filter(inquiry => {
        const inquiryCampaigns = inquiry.campaigns?.map(c => c.campaign.id) || []
        return inquiryCampaigns.some(campaignId => filters.campaigns.includes(campaignId))
      })
    }

    // Marketing source filter
    if (filters.marketingSources.length > 0) {
      filtered = filtered.filter(inquiry => filters.marketingSources.includes(inquiry.marketingSource))
    }

    // Age band filter
    if (filters.ageBands.length > 0) {
      filtered = filtered.filter(inquiry => filters.ageBands.includes(inquiry.ageBand || ''))
    }

    // City filter
    if (filters.cities.length > 0) {
      filtered = filtered.filter(inquiry => filters.cities.includes(inquiry.city || ''))
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(inquiry => {
        const inquiryDate = new Date(inquiry.createdAt)
        if (filters.dateRange.from && inquiryDate < filters.dateRange.from) return false
        if (filters.dateRange.to && inquiryDate > filters.dateRange.to) return false
        return true
      })
    }

    // Follow-up required filter
    if (filters.followUpRequired !== null) {
      filtered = filtered.filter(inquiry => inquiry.followUpAgain === filters.followUpRequired)
    }

    // WhatsApp filter
    if (filters.hasWhatsapp !== null) {
      filtered = filtered.filter(inquiry => inquiry.whatsapp === filters.hasWhatsapp)
    }

    // Recent filter (last 7 days)
    if (filters.showRecent) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(inquiry => new Date(inquiry.createdAt) >= weekAgo)
    }

    return filtered
  }, [inquiries, filters])

  // Update parent component with filtered inquiries
  React.useEffect(() => {
    onFilteredInquiries(filteredInquiries)
  }, [filteredInquiries, onFilteredInquiries])

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }))
  }

  const handleArrayFilterToggle = (filterType: keyof Pick<FilterState, 'stages' | 'programs' | 'campaigns' | 'marketingSources' | 'ageBands' | 'cities'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      stages: [],
      programs: [],
      campaigns: [],
      marketingSources: [],
      ageBands: [],
      cities: [],
      dateRange: {},
      followUpRequired: null,
      hasWhatsapp: null,
      showRecent: false,
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.stages.length > 0) count++
    if (filters.programs.length > 0) count++
    if (filters.campaigns.length > 0) count++
    if (filters.marketingSources.length > 0) count++
    if (filters.ageBands.length > 0) count++
    if (filters.cities.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.followUpRequired !== null) count++
    if (filters.hasWhatsapp !== null) count++
    if (filters.showRecent) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={`shadow-sm border-gray-200 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Professional Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search inquiries by name, phone, email, city, programs, campaigns, or source..."
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10 shadow-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 h-10 shadow-sm border-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 border-blue-200">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              {/* Stage Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Stage</span>
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stageOptions.map((stage) => (
                    <div
                      key={stage.value}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.stages.includes(stage.value) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleArrayFilterToggle('stages', stage.value)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.stages.includes(stage.value)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">{stage.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Programs</span>
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.programs.includes(program.id) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleArrayFilterToggle('programs', program.id)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.programs.includes(program.id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm truncate">{program.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <Megaphone className="h-4 w-4" />
                  <span>Campaigns</span>
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.campaigns.includes(campaign.id) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleArrayFilterToggle('campaigns', campaign.id)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.campaigns.includes(campaign.id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm truncate">{campaign.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing Source Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketing Source</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {uniqueMarketingSources.map((source) => (
                    <div
                      key={source}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.marketingSources.includes(source) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleArrayFilterToggle('marketingSources', source)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.marketingSources.includes(source)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">{source.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Band Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Band</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {ageBandOptions.map((ageBand) => (
                    <div
                      key={ageBand}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.ageBands.includes(ageBand) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleArrayFilterToggle('ageBands', ageBand)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.ageBands.includes(ageBand)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">{ageBand}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Cities</span>
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {uniqueCities.map((city) => (
                    <div
                      key={city}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.cities.includes(city) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleArrayFilterToggle('cities', city)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.cities.includes(city)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">{city}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range & Quick Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date & Quick Filters</span>
                </label>
                <div className="space-y-2">
                  {/* Date Range */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          filters.dateRange.to ? (
                            `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to, 'MMM dd')}`
                          ) : (
                            format(filters.dateRange.from, 'MMM dd, yyyy')
                          )
                        ) : (
                          'Select date range'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={filters.dateRange.from}
                          selected={filters.dateRange.from ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined}
                          onSelect={(range) => setFilters(prev => ({
                            ...prev,
                            dateRange: range || { from: undefined, to: undefined }
                          }))}
                          numberOfMonths={2}
                        />
                    </PopoverContent>
                  </Popover>

                  {/* Quick Filters */}
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.showRecent && "bg-orange-50 border border-orange-200"
                      )}
                      onClick={() => setFilters(prev => ({ ...prev, showRecent: !prev.showRecent }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.showRecent}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Recent (7 days)</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.followUpRequired === true && "bg-yellow-50 border border-yellow-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        followUpRequired: prev.followUpRequired === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.followUpRequired === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Follow-up Required</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.hasWhatsapp === true && "bg-green-50 border border-green-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        hasWhatsapp: prev.hasWhatsapp === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.hasWhatsapp === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Has WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.searchQuery && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Search: "{filters.searchQuery}"</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  />
                </Badge>
              )}
              {filters.stages.map(stage => (
                <Badge key={stage} variant="secondary" className="flex items-center space-x-1">
                  <span>Stage: {stage}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleArrayFilterToggle('stages', stage)}
                  />
                </Badge>
              ))}
              {filters.programs.map(programId => {
                const program = programs.find(p => p.id === programId)
                return (
                  <Badge key={programId} variant="secondary" className="flex items-center space-x-1">
                    <span>Program: {program?.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayFilterToggle('programs', programId)}
                    />
                  </Badge>
                )
              })}
              {filters.campaigns.map(campaignId => {
                const campaign = campaigns.find(c => c.id === campaignId)
                return (
                  <Badge key={campaignId} variant="secondary" className="flex items-center space-x-1">
                    <span>Campaign: {campaign?.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayFilterToggle('campaigns', campaignId)}
                    />
                  </Badge>
                )
              })}
              {filters.marketingSources.map(source => (
                <Badge key={source} variant="secondary" className="flex items-center space-x-1">
                  <span>Source: {source.replace('_', ' ')}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleArrayFilterToggle('marketingSources', source)}
                  />
                </Badge>
              ))}
              {filters.ageBands.map(ageBand => (
                <Badge key={ageBand} variant="secondary" className="flex items-center space-x-1">
                  <span>Age: {ageBand}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleArrayFilterToggle('ageBands', ageBand)}
                  />
                </Badge>
              ))}
              {filters.cities.map(city => (
                <Badge key={city} variant="secondary" className="flex items-center space-x-1">
                  <span>City: {city}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleArrayFilterToggle('cities', city)}
                  />
                </Badge>
              ))}
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>
                    Date: {filters.dateRange.from ? format(filters.dateRange.from, 'MMM dd') : 'Start'}
                    {' - '}
                    {filters.dateRange.to ? format(filters.dateRange.to, 'MMM dd') : 'End'}
                  </span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: {} }))}
                  />
                </Badge>
              )}
              {filters.showRecent && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Recent</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, showRecent: false }))}
                  />
                </Badge>
              )}
              {filters.followUpRequired === true && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Follow-up Required</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, followUpRequired: null }))}
                  />
                </Badge>
              )}
              {filters.hasWhatsapp === true && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Has WhatsApp</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, hasWhatsapp: null }))}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
