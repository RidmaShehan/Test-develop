'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Search, Filter, X, User, GraduationCap, Megaphone, MapPin, Clock, Save, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

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
  notAnswering?: boolean
  registerNow?: boolean
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
  createdById?: string
  createdBy?: {
    id: string
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

interface SavedFilter {
  id: string
  name: string
  description?: string
  filterData: any
  entityType: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface FilterState {
  searchQuery: string
  stages: string[]
  programs: string[]
  campaigns: string[]
  marketingSources: string[]
  ageBands: string[]
  cities: string[]
  createdByUsers: string[] // User IDs who created the inquiries
  dateRange: {
    from?: Date
    to?: Date
  }
  followUpRequired: boolean | null
  hasWhatsapp: boolean | null
  showRecent: boolean
  notAnswering: boolean | null
  registerNow: boolean | null
  completed: boolean | null
  hold: boolean | null
  interested: boolean | null
  notInterested: boolean | null
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
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    stages: [],
    programs: [],
    campaigns: [],
    marketingSources: [],
    ageBands: [],
    cities: [],
    createdByUsers: [],
    dateRange: {},
    followUpRequired: null,
    hasWhatsapp: null,
    showRecent: false,
    notAnswering: null,
    registerNow: null,
    completed: null,
    hold: null,
    interested: null,
    notInterested: null,
  })

  const [showFilters, setShowFilters] = useState(false)
  const [newFilterName, setNewFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Server-side Saved Filters
  const { data: savedFiltersData } = useQuery({
    queryKey: ['saved-filters', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/saved-filters?entityType=inquiry')
      if (!res.ok) throw new Error('Failed to fetch saved filters')
      const data = await res.json()
      return data.filters as SavedFilter[]
    },
    enabled: !!user?.id,
  })

  const savedFilters = savedFiltersData || []

  // Save current filter
  const saveCurrentFilter = async () => {
    if (!newFilterName.trim() || !user) {
      toast.error('Please enter a filter name')
      return
    }

    try {
      const response = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFilterName.trim(),
          description: `Saved filter for ${newFilterName}`,
          filterData: filters,
          entityType: 'inquiry'
        }),
      })

      if (response.ok) {
        toast.success('Filter saved successfully!')
        setNewFilterName('')
        setShowSaveDialog(false)
        queryClient.invalidateQueries({ queryKey: ['saved-filters', user.id] })
      } else {
        toast.error('Failed to save filter')
      }
    } catch (error) {
      toast.error('Failed to save filter')
    }
  }

  // Load a saved filter
  const loadSavedFilter = (savedFilter: SavedFilter) => {
    try {
      const loadedFilters = savedFilter.filterData
      
      // Merge with current filter state to preserve any new fields
      setFilters(prev => ({
        ...prev,
        ...loadedFilters,
        // Preserve current search query if not in saved filter
        searchQuery: loadedFilters.searchQuery !== undefined ? loadedFilters.searchQuery : prev.searchQuery,
      }))
      
      // Trigger re-filtering with a small delay to ensure state is updated
      setTimeout(() => {
        onFilteredInquiries(inquiries)
      }, 10)
      
      toast.success(`Loaded filter: ${savedFilter.name}`)
    } catch (error) {
      console.error('Error loading filter:', error)
      toast.error('Failed to load filter')
    }
  }

  // Delete a saved filter
  const deleteSavedFilter = async (filterId: string, filterName: string) => {
    if (!confirm(`Delete filter "${filterName}"?`)) return

    try {
      const response = await fetch(`/api/saved-filters?id=${filterId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Filter deleted')
        queryClient.invalidateQueries({ queryKey: ['saved-filters', user?.id] })
      } else {
        toast.error('Failed to delete filter')
      }
    } catch (error) {
      toast.error('Failed to delete filter')
    }
  }

  // Get unique values from inquiries for filter options
  const uniqueMarketingSources = useMemo(() => {
    const sources = inquiries.map(inquiry => inquiry.marketingSource)
    return Array.from(new Set(sources))
  }, [inquiries])

  const uniqueCities = useMemo(() => {
    const cities = inquiries.map(inquiry => inquiry.city).filter(Boolean) as string[]
    return Array.from(new Set(cities))
  }, [inquiries])

  // Get unique createdBy users from inquiries
  const uniqueCreatedByUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string }>()
    inquiries.forEach(inquiry => {
      if (inquiry.createdById && inquiry.createdBy?.name) {
        if (!userMap.has(inquiry.createdById)) {
          userMap.set(inquiry.createdById, {
            id: inquiry.createdById,
            name: inquiry.createdBy.name
          })
        }
      }
    })
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name))
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
        inquiry.stage.toLowerCase().includes(query) ||
        inquiry.createdBy?.name.toLowerCase().includes(query)
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

    // Created By User filter
    if (filters.createdByUsers.length > 0) {
      filtered = filtered.filter(inquiry => 
        inquiry.createdById && filters.createdByUsers.includes(inquiry.createdById)
      )
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

    // Not Answering filter
    if (filters.notAnswering !== null) {
      filtered = filtered.filter(inquiry => {
        const inquiryNotAnswering = inquiry.notAnswering === true
        return inquiryNotAnswering === filters.notAnswering
      })
    }

    // Register Now filter
    if (filters.registerNow !== null) {
      filtered = filtered.filter(inquiry => {
        const inquiryRegisterNow = inquiry.registerNow === true
        return inquiryRegisterNow === filters.registerNow
      })
    }

    // Completed filter (inquiries ready to register)
    if (filters.completed !== null) {
      filtered = filtered.filter(inquiry => {
        const isCompleted = inquiry.stage === 'READY_TO_REGISTER' || inquiry.registerNow === true
        return isCompleted === filters.completed
      })
    }

    // Hold filter (not answering and not ready to register)
    if (filters.hold !== null) {
      filtered = filtered.filter(inquiry => {
        const isOnHold = inquiry.notAnswering === true && 
                        inquiry.stage !== 'READY_TO_REGISTER' && 
                        inquiry.registerNow !== true
        return isOnHold === filters.hold
      })
    }

    // Interested filter (high preferredStatus or positive stages)
    if (filters.interested !== null) {
      filtered = filtered.filter(inquiry => {
        const interestedStages = ['CONNECTED', 'QUALIFIED', 'COUNSELING_SCHEDULED', 'CONSIDERING', 'READY_TO_REGISTER']
        const isInterested = interestedStages.includes(inquiry.stage) || 
                            (inquiry.preferredStatus !== null && inquiry.preferredStatus !== undefined && inquiry.preferredStatus >= 5)
        return isInterested === filters.interested
      })
    }

    // Not Interested filter (LOST stage or low preferredStatus)
    if (filters.notInterested !== null) {
      filtered = filtered.filter(inquiry => {
        const isNotInterested = inquiry.stage === 'LOST' || 
                               (inquiry.preferredStatus !== null && inquiry.preferredStatus !== undefined && inquiry.preferredStatus < 5)
        return isNotInterested === filters.notInterested
      })
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

  const handleArrayFilterToggle = (filterType: keyof Pick<FilterState, 'stages' | 'programs' | 'campaigns' | 'marketingSources' | 'ageBands' | 'cities' | 'createdByUsers'>, value: string) => {
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
      createdByUsers: [],
      dateRange: {},
      followUpRequired: null,
      hasWhatsapp: null,
      showRecent: false,
      notAnswering: null,
      registerNow: null,
      completed: null,
      hold: null,
      interested: null,
      notInterested: null,
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
    if (filters.createdByUsers.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.followUpRequired !== null) count++
    if (filters.hasWhatsapp !== null) count++
    if (filters.showRecent) count++
    if (filters.notAnswering !== null) count++
    if (filters.registerNow !== null) count++
    if (filters.completed !== null) count++
    if (filters.hold !== null) count++
    if (filters.interested !== null) count++
    if (filters.notInterested !== null) count++
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
                placeholder="Search inquiries by name, phone, email, city, programs, campaigns, source, or creator..."
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

              {/* Created By User Filter */}
              {uniqueCreatedByUsers.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Created By</span>
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {uniqueCreatedByUsers.map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                          filters.createdByUsers.includes(user.id) && "bg-blue-50 border border-blue-200"
                        )}
                        onClick={() => handleArrayFilterToggle('createdByUsers', user.id)}
                      >
                        <input
                          type="checkbox"
                          checked={filters.createdByUsers.includes(user.id)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.notAnswering === true && "bg-red-50 border border-red-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        notAnswering: prev.notAnswering === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.notAnswering === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Not Answering</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.registerNow === true && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        registerNow: prev.registerNow === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.registerNow === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Register</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.completed === true && "bg-purple-50 border border-purple-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        completed: prev.completed === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.completed === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Completed</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.hold === true && "bg-yellow-50 border border-yellow-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        hold: prev.hold === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.hold === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Hold</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.interested === true && "bg-emerald-50 border border-emerald-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        interested: prev.interested === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.interested === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Interested</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.notInterested === true && "bg-rose-50 border border-rose-200"
                      )}
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        notInterested: prev.notInterested === true ? null : true 
                      }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.notInterested === true}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">Not Interested</span>
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
              {filters.createdByUsers.map(userId => {
                const user = uniqueCreatedByUsers.find(u => u.id === userId)
                return (
                  <Badge key={userId} variant="secondary" className="flex items-center space-x-1">
                    <span>Created By: {user?.name}</span>
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleArrayFilterToggle('createdByUsers', userId)}
                    />
                  </Badge>
                )
              })}
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
              {filters.notAnswering === true && (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-red-100 text-red-700">
                  <span>Not Answering</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, notAnswering: null }))}
                  />
                </Badge>
              )}
              {filters.registerNow === true && (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-blue-100 text-blue-700">
                  <span>Register</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, registerNow: null }))}
                  />
                </Badge>
              )}
              {filters.completed === true && (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-purple-100 text-purple-700">
                  <span>Completed</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, completed: null }))}
                  />
                </Badge>
              )}
              {filters.hold === true && (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-yellow-100 text-yellow-700">
                  <span>Hold</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, hold: null }))}
                  />
                </Badge>
              )}
              {filters.interested === true && (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-emerald-100 text-emerald-700">
                  <span>Interested</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, interested: null }))}
                  />
                </Badge>
              )}
              {filters.notInterested === true && (
                <Badge variant="secondary" className="flex items-center space-x-1 bg-rose-100 text-rose-700">
                  <span>Not Interested</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, notInterested: null }))}
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

      <Card className="mt-4">
        <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Save className="h-4 w-4" />
                Saved Filters
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="h-8"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Current
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="group flex items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-3 py-1.5 text-sm cursor-pointer transition-all"
                  onClick={() => loadSavedFilter(filter)}
                >
                  <span className="font-medium text-gray-700">{filter.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSavedFilter(filter.id, filter.name)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Save Current Filter</h3>
            <Input
              placeholder="Filter name (e.g. Hot Leads This Week)"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false)
                  setNewFilterName('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCurrentFilter}
                disabled={!newFilterName.trim()}
                className="flex-1"
              >
                Save Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
