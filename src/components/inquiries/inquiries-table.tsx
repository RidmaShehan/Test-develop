// @ts-nocheck
'use client'

import * as React from 'react'
import { ChangeEvent, useCallback, useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Phone, MessageSquare, Mail, User, Loader2, Pencil, Trash2 } from 'lucide-react'
import { InquiryViewDialog } from './inquiry-view-dialog'
import { EditInquiryDialog } from './edit-inquiry-dialog'
import { InquirySearchFilter } from './inquiry-search-filter'
import { safeJsonParse } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
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
  followUpDate?: string
  followUpTime?: string
  description?: string
  whatsapp: boolean
  whatsappNumber?: string
  notAnswering?: boolean
  emailNotAnswering?: boolean
  registerNow?: boolean
  guardianPhone?: string
  consent: boolean
  stage: string
  marketingSource: string
  createdAt: string
  updatedAt?: string
  createdById?: string
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

export function InquiriesTable() {
  const [allInquiries, setAllInquiries] = React.useState<Inquiry[]>([])
  const [filteredInquiries, setFilteredInquiries] = React.useState<Inquiry[]>([])
  const [programs, setPrograms] = React.useState<any[]>([])
  const [campaigns, setCampaigns] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedInquiry, setSelectedInquiry] = React.useState<Inquiry | null>(null)
  const [editingInquiry, setEditingInquiry] = React.useState<Inquiry | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const fetchInquiriesAbortController = useRef<AbortController | null>(null)
  const lastFetchTime = useRef<number>(0)
  const FETCH_DEBOUNCE_MS = 500 // Minimum time between fetches
  const { hasPermission } = usePermissions()
  const { user } = useAuth()

  React.useEffect(() => {
    fetchInitialData()
    
    // Cleanup: abort any pending requests on unmount
    return () => {
      if (fetchInquiriesAbortController.current) {
        fetchInquiriesAbortController.current.abort()
      }
    }
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [inquiriesResponse, programsResponse, campaignsResponse] = await Promise.all([
        fetch('/api/inquiries?page=1&limit=20'),
        fetch('/api/programs'),
        fetch('/api/campaigns?page=1&limit=100')
      ])

      if (inquiriesResponse.ok) {
        const inquiriesData = await safeJsonParse(inquiriesResponse)
        // Handle new paginated response structure
        const inquiries = inquiriesData.inquiries || (Array.isArray(inquiriesData) ? inquiriesData : [])
        setAllInquiries(inquiries)
        setFilteredInquiries(inquiries)
        setHasMore(inquiriesData.pagination?.hasMore || false)
        setPage(1)
      }

      if (programsResponse.ok) {
        const programsData = await safeJsonParse(programsResponse)
        setPrograms(programsData)
      }

      if (campaignsResponse.ok) {
        const campaignsData = await safeJsonParse(campaignsResponse)
        // Handle new paginated response structure
        const campaigns = campaignsData.campaigns || (Array.isArray(campaignsData) ? campaignsData : [])
        setCampaigns(campaigns)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMoreInquiries = React.useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    // Debounce: prevent too many rapid requests
    const now = Date.now()
    if (!reset && now - lastFetchTime.current < FETCH_DEBOUNCE_MS) {
      return
    }
    lastFetchTime.current = now

    // Cancel previous request if still pending
    if (fetchInquiriesAbortController.current) {
      fetchInquiriesAbortController.current.abort()
    }
    
    // Create new abort controller for this request
    fetchInquiriesAbortController.current = new AbortController()

    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/inquiries?page=${pageNum}&limit=20`, {
        signal: fetchInquiriesAbortController.current.signal
      })

      if (response.ok) {
        const data = await safeJsonParse(response)
        const inquiries = data.inquiries || []
        
        if (reset) {
          setAllInquiries(inquiries)
          setFilteredInquiries(inquiries)
        } else {
          // Avoid duplicates by checking IDs
          setAllInquiries(prev => {
            const existingIds = new Set(prev.map(inq => inq.id))
            const newInquiries = inquiries.filter((inq: Inquiry) => !existingIds.has(inq.id))
            return [...prev, ...newInquiries]
          })
          setFilteredInquiries(prev => {
            const existingIds = new Set(prev.map(inq => inq.id))
            const newInquiries = inquiries.filter((inq: Inquiry) => !existingIds.has(inq.id))
            return [...prev, ...newInquiries]
          })
        }
        
        setHasMore(data.pagination?.hasMore || false)
        setPage(pageNum)
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return
      }
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      fetchInquiriesAbortController.current = null
    }
  }, [])

  const handleFilteredInquiries = (inquiries: Inquiry[]) => {
    setFilteredInquiries(inquiries)
    // Check if we're filtering (filtered results are different from all loaded inquiries)
    const isCurrentlyFiltering = inquiries.length !== allInquiries.length || 
                                  inquiries.some((inq, idx) => inq.id !== allInquiries[idx]?.id)
    setIsFiltering(isCurrentlyFiltering)
    
    // If filters are cleared and we have more data, allow loading more
    if (!isCurrentlyFiltering && hasMore && allInquiries.length > 0) {
      // Continue loading if we haven't loaded all data yet
      const totalLoaded = allInquiries.length
      // If we have less than 100 items loaded, we might have more
      if (totalLoaded < 100) {
        setHasMore(true)
      }
    }
  }

  const getNameIndicatorColor = (inquiry: Inquiry) => {
    if (inquiry.notAnswering) return 'bg-red-500'
    if (inquiry.followUpAgain) return 'bg-orange-500'
    if (inquiry.registerNow) return 'bg-green-500'
    return 'bg-transparent'
  }

  const handleDeleteInquiry = async (inquiryId: string, inquiryName: string) => {
    if (!confirm(`Are you sure you want to delete "${inquiryName}"?\n\nThis will move it to Trash Bin.`)) {
      return
    }

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Inquiry moved to trash')
        setAllInquiries((prev) => prev.filter((i) => i.id !== inquiryId))
        setFilteredInquiries((prev) => prev.filter((i) => i.id !== inquiryId))
      } else {
        const result = await safeJsonParse(response)
        toast.error(result?.error || 'Failed to delete inquiry')
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      toast.error('Failed to delete inquiry')
    }
  }

  // Infinite scroll observer - watch for scroll near bottom of container
  React.useEffect(() => {
    const container = observerTarget.current
    if (!container || isFiltering) return // Don't trigger infinite scroll when filtering

    let ticking = false
    let lastScrollTop = 0

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = container
          
          // Only trigger if scrolling down (not up)
          if (scrollTop > lastScrollTop) {
            // Load more when user scrolls within 300px of bottom
            if (scrollHeight - scrollTop - clientHeight < 300 && hasMore && !loadingMore && !loading) {
              fetchMoreInquiries(page + 1, false)
            }
          }
          
          lastScrollTop = scrollTop
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
  }, [hasMore, loadingMore, loading, page, isFiltering, fetchMoreInquiries])

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-gray-100 text-gray-800',
      ATTEMPTING_CONTACT: 'bg-yellow-100 text-yellow-800',
      CONNECTED: 'bg-blue-100 text-blue-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      COUNSELING_SCHEDULED: 'bg-purple-100 text-purple-800',
      CONSIDERING: 'bg-orange-100 text-orange-800',
      READY_TO_REGISTER: 'bg-emerald-100 text-emerald-800',
      LOST: 'bg-red-100 text-red-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getSourceColor = (source: string) => {
    // Default colors for common sources
    const defaultColors: Record<string, string> = {
      WALK_IN: 'bg-green-100 text-green-800',
      FB_AD: 'bg-blue-100 text-blue-800',
      REFERRAL: 'bg-purple-100 text-purple-800',
      WEBSITE: 'bg-orange-100 text-orange-800',
      PHONE: 'bg-gray-100 text-gray-800',
      EMAIL: 'bg-blue-100 text-blue-800',
      SMS: 'bg-green-100 text-green-800',
      FACEBOOK: 'bg-blue-100 text-blue-800',
      INSTAGRAM: 'bg-pink-100 text-pink-800',
      NEWSPAPERS: 'bg-gray-100 text-gray-800',
      TV: 'bg-purple-100 text-purple-800',
      EDUCATION_FAIRS: 'bg-yellow-100 text-yellow-800',
      CALL_CAMPAIGN: 'bg-red-100 text-red-800',
      DIRECT_MAIL: 'bg-green-100 text-green-800',
    }
    return defaultColors[source] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Loading inquiries...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Search and Filter Component */}
      <InquirySearchFilter 
        inquiries={allInquiries} 
        programs={programs}
        campaigns={campaigns}
        onFilteredInquiries={handleFilteredInquiries}
      />

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">All Inquiries</CardTitle>
            <Badge variant="secondary" className="text-xs font-medium">
              {filteredInquiries.length} {filteredInquiries.length === 1 ? 'inquiry' : 'inquiries'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">

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
              {/* Use outer container as the only horizontal scroller so sticky Name works reliably */}
              <Table className="w-full" containerClassName="overflow-x-visible">
                <TableHeader className="sticky top-0 bg-white z-30 shadow-sm">
                  <TableRow className="hover:bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-900 min-w-[150px] sticky left-0 bg-white z-50 border-r shadow-[2px_0_4px_rgba(0,0,0,0.05)]">Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[120px]">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[130px]">WhatsApp</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[180px]">Email</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[80px]">Age</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[120px]">City</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[120px]">Guardian Phone</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[100px]">Follow up</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[130px]">Follow Up Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[130px]">Preferred Time</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[80px]">Consent</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[150px]">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[150px]">Program</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[150px]">Campaign</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[120px]">Stage</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[120px]">Source</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[100px]">Created</TableHead>
                    <TableHead className="font-semibold text-gray-900 min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry: Inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50/30 transition-colors group">
                      <TableCell className="relative font-semibold text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50/30 z-10 border-r whitespace-nowrap truncate max-w-[150px] shadow-[2px_0_4px_rgba(0,0,0,0.05)] pl-4">
                        <span
                          className={`absolute left-0 inset-y-0 w-2 rounded-r ${getNameIndicatorColor(inquiry)}`}
                          aria-hidden="true"
                        />
                        {inquiry.fullName}
                      </TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap">{inquiry.phone}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inquiry.whatsapp ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs w-fit">Yes</Badge>
                            {inquiry.whatsappNumber && (
                              <span className="text-xs text-gray-600">{inquiry.whatsappNumber}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap truncate max-w-[180px]">{inquiry.email || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap">{inquiry.ageBand || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap truncate max-w-[120px]">{inquiry.city || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap">{inquiry.guardianPhone || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inquiry.followUpAgain ? (
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Yes</Badge>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap">
                        {inquiry.followUpDate ? (
                          <div className="flex flex-col">
                            <span className="text-sm">{inquiry.followUpDate}</span>
                            {inquiry.followUpTime && (
                              <span className="text-xs text-gray-500">{inquiry.followUpTime}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700 whitespace-nowrap">{inquiry.preferredContactTime || <span className="text-gray-400">-</span>}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inquiry.consent ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        {inquiry.preferredStatus ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300 shadow-inner">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 border-r border-gray-300 last:border-r-0 transition-colors"
                                  style={{
                                    backgroundColor: i < (inquiry.preferredStatus || 0) 
                                      ? (() => {
                                          const progress = (i + 1) / 10 // 0.1 to 1.0
                                          if (progress <= 0.5) {
                                            // Red to Yellow (0.1 to 0.5)
                                            const localProgress = progress * 2 // 0.2 to 1.0
                                            const red = 255
                                            const green = Math.floor(255 * localProgress)
                                            const blue = 0
                                            return `rgba(${red}, ${green}, ${blue}, 0.9)`
                                          } else {
                                            // Yellow to Green (0.5 to 1.0)
                                            const localProgress = (progress - 0.5) * 2 // 0.0 to 1.0
                                            const red = Math.floor(255 * (1 - localProgress))
                                            const green = 255
                                            const blue = 0
                                            return `rgba(${red}, ${green}, ${blue}, 0.9)`
                                          }
                                        })()
                                      : 'rgba(229, 231, 235, 0.5)'
                                  }}
                                />
                              ))}
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs font-medium px-1.5 py-0 bg-gray-50 text-gray-700 border-gray-200"
                            >
                              {inquiry.preferredStatus}/10
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex flex-wrap gap-1.5">
                          {/* Show preferred programs if available */}
                          {inquiry.preferredPrograms && inquiry.preferredPrograms.length > 0 ? (
                            inquiry.preferredPrograms.map((pref, index) => (
                              <Badge 
                                key={pref.id} 
                                variant="secondary" 
                                className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                              >
                                {pref.program.name}
                              </Badge>
                            ))
                          ) : (
                            /* Fallback to single program interest for backward compatibility */
                            inquiry.programInterest?.name ? (
                              <Badge 
                                variant="secondary" 
                                className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                              >
                                {inquiry.programInterest.name}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex flex-wrap gap-1.5">
                          {inquiry.campaigns && inquiry.campaigns.length > 0 ? (
                            inquiry.campaigns.map((campaignRef, index) => (
                              <Badge 
                                key={campaignRef.id} 
                                variant="outline" 
                                className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 shadow-sm"
                              >
                                {campaignRef.campaign.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={`${getStageColor(inquiry.stage)} text-xs font-medium px-2 py-0.5 shadow-sm`}>
                          {inquiry.stage.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={`${getSourceColor(inquiry.marketingSource)} text-xs font-medium px-2 py-0.5 shadow-sm`}>
                          {inquiry.marketingSource.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm whitespace-nowrap">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setSelectedInquiry(inquiry)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {hasPermission('UPDATE_SEEKER') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              onClick={() => setEditingInquiry(inquiry)}
                              title="Edit Inquiry"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          {user?.id && inquiry.createdById === user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete (Move to Trash)"
                              onClick={() => handleDeleteInquiry(inquiry.id, inquiry.fullName)}
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
            
            {/* Infinite Scroll Loading Indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-4 sticky bottom-0 bg-white border-t">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-gray-600">Loading more inquiries...</span>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredInquiries.map((inquiry: Inquiry) => (
              <Card key={inquiry.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="relative pl-4">
                        <span
                          className={`absolute left-0 inset-y-0 w-2 rounded-r ${getNameIndicatorColor(inquiry)}`}
                          aria-hidden="true"
                        />
                        <h3 className="font-semibold text-base text-gray-900 truncate">{inquiry.fullName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{inquiry.phone}</p>
                      {inquiry.whatsapp && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">WhatsApp</Badge>
                          {inquiry.whatsappNumber && inquiry.whatsappNumber !== inquiry.phone && (
                            <span className="text-xs text-gray-500">({inquiry.whatsappNumber})</span>
                          )}
                        </div>
                      )}
                      {inquiry.email && (
                        <p className="text-sm text-gray-600 truncate">{inquiry.email}</p>
                      )}
                      {inquiry.guardianPhone && (
                        <p className="text-xs text-gray-500 mt-0.5">Guardian: {inquiry.guardianPhone}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedInquiry(inquiry)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission('UPDATE_SEEKER') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => setEditingInquiry(inquiry)}
                          title="Edit Inquiry"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Call"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {user?.id && inquiry.createdById === user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                          title="Delete (Move to Trash)"
                          onClick={() => handleDeleteInquiry(inquiry.id, inquiry.fullName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Age:</span>
                      <span className="ml-1 text-gray-900">{inquiry.ageBand || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">City:</span>
                      <span className="ml-1 text-gray-900">{inquiry.city || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Follow Up:</span>
                      {inquiry.followUpAgain ? (
                        <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs ml-1">Yes</Badge>
                      ) : (
                        <span className="ml-1 text-gray-400">No</span>
                      )}
                    </div>
                    {inquiry.followUpDate && (
                      <div>
                        <span className="text-gray-500">Follow Up Date:</span>
                        <span className="ml-1 text-gray-900 text-xs">
                          {inquiry.followUpDate}
                          {inquiry.followUpTime && ` ${inquiry.followUpTime}`}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Consent:</span>
                      {inquiry.consent ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs ml-1">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500 ml-1">No</Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Preferred Time:</span>
                      <span className="ml-1 text-gray-900">{inquiry.preferredContactTime || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stage:</span>
                      <Badge className={`${getStageColor(inquiry.stage)} text-xs font-medium px-2 py-0.5 shadow-sm ml-1`}>
                        {inquiry.stage.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Source:</span>
                      <Badge className={`${getSourceColor(inquiry.marketingSource)} text-xs font-medium px-2 py-0.5 shadow-sm ml-1`}>
                        {inquiry.marketingSource.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  {(inquiry.preferredPrograms && inquiry.preferredPrograms.length > 0) || inquiry.programInterest?.name ? (
                    <div>
                      <span className="text-sm text-gray-500">Program:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {inquiry.preferredPrograms && inquiry.preferredPrograms.length > 0 ? (
                          inquiry.preferredPrograms.map((pref) => (
                            <Badge 
                              key={pref.id} 
                              variant="secondary" 
                              className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                            >
                              {pref.program.name}
                            </Badge>
                          ))
                        ) : (
                          inquiry.programInterest?.name && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                            >
                              {inquiry.programInterest.name}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  ) : null}

                  {inquiry.campaigns && inquiry.campaigns.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Campaign:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {inquiry.campaigns.map((campaignRef) => (
                          <Badge 
                            key={campaignRef.id} 
                            variant="outline" 
                            className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200 shadow-sm"
                          >
                            {campaignRef.campaign.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Created: {new Date(inquiry.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredInquiries.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">No inquiries found</p>
              <p className="text-xs text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInquiry && (
        <InquiryViewDialog
          inquiry={selectedInquiry}
          open={!!selectedInquiry}
          onOpenChange={() => setSelectedInquiry(null)}
        />
      )}

      {editingInquiry && (
        <EditInquiryDialog
          inquiry={editingInquiry}
          open={!!editingInquiry}
          onOpenChange={() => setEditingInquiry(null)}
          onSuccess={() => {
            setEditingInquiry(null)
            // Refresh the inquiries list
            fetchInitialData()
          }}
        />
      )}
    </>
  )
}
