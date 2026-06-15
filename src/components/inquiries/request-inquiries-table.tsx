'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Plus, Loader2, MapPin, RefreshCw, Search, CalendarIcon, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { NewInquiryDialog } from './new-inquiry-dialog'
import { ImportRequestInquiriesDialog } from './import-request-inquiries-dialog'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface Program {
  id: number
  programName: string
  category: string | null
  isActive: boolean
}

interface VisitorProgram {
  id: string
  program: Program
}

interface VisitorMetadata {
  id: string
  ipAddress: string | null
  country: string | null
  city: string | null
  region: string | null
  timezone: string | null
  browser: string | null
  device: string | null
  submissionDate: string | null
  submissionTime: string | null
}

interface RequestInquiry {
  id: string
  name: string
  workPhone: string
  isConverted: boolean
  convertedAt: string | null
  createdAt: string
  programs: VisitorProgram[]
  metadata: VisitorMetadata | null
  addressee?: string | null
  coordinatorId?: string | null
  coordinatorName?: string | null
  campaignId?: string | null
  campaignName?: string | null
}

interface ExpandedRequestInquiry {
  id: string
  visitorId: string
  name: string
  workPhone: string
  isConverted: boolean
  convertedAt: string | null
  createdAt: string
  program: Program
  metadata: VisitorMetadata | null
  allPrograms: VisitorProgram[]
  addressee?: string | null
  coordinatorId?: string | null
  coordinatorName?: string | null
  campaignId?: string | null
  campaignName?: string | null
}

export function RequestInquiriesTable() {
  const [requestInquiries, setRequestInquiries] = useState<RequestInquiry[]>([])
  const [expandedInquiries, setExpandedInquiries] = useState<ExpandedRequestInquiry[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<ExpandedRequestInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<RequestInquiry | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [coordinators, setCoordinators] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingAddresseeId, setEditingAddresseeId] = useState<string | null>(null)
  const [tempAddressee, setTempAddressee] = useState('')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const [displayLimit, setDisplayLimit] = useState(50)
  const [programFilter, setProgramFilter] = useState<string>('all')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [coordinatorFilter, setCoordinatorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  const { user: _user } = useAuth()

  const fetchRequestInquiries = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await fetch('/api/request-inquiries')
      if (response.ok) {
        const data = await response.json()
        setRequestInquiries(data)
        
        // Expand each visitor into multiple rows if they have multiple programs
        const expanded: ExpandedRequestInquiry[] = []
        data.forEach((inquiry: RequestInquiry) => {
          if (inquiry.programs && inquiry.programs.length > 0) {
            // Create one row per program
            inquiry.programs.forEach((vp) => {
              expanded.push({
                id: `${inquiry.id}-${vp.program.id}`, // Unique ID for each row
                visitorId: inquiry.id,
                name: inquiry.name,
                workPhone: inquiry.workPhone,
                isConverted: inquiry.isConverted,
                convertedAt: inquiry.convertedAt,
                createdAt: inquiry.createdAt,
                program: vp.program,
                metadata: inquiry.metadata,
                allPrograms: inquiry.programs,
                addressee: inquiry.addressee,
                coordinatorId: inquiry.coordinatorId,
                coordinatorName: inquiry.coordinatorName,
                campaignId: inquiry.campaignId,
                campaignName: inquiry.campaignName,
              })
            })
          } else {
            // No programs, create single row
            expanded.push({
              id: inquiry.id,
              visitorId: inquiry.id,
              name: inquiry.name,
              workPhone: inquiry.workPhone,
              isConverted: inquiry.isConverted,
              convertedAt: inquiry.convertedAt,
              createdAt: inquiry.createdAt,
              program: { id: 0, programName: 'None', category: null, isActive: true },
              metadata: inquiry.metadata,
              allPrograms: [],
              addressee: inquiry.addressee,
              coordinatorId: inquiry.coordinatorId,
              coordinatorName: inquiry.coordinatorName,
              campaignId: inquiry.campaignId,
              campaignName: inquiry.campaignName,
            })
          }
        })
        
        setExpandedInquiries(expanded)
        setFilteredInquiries(expanded)
      } else {
        toast.error('Failed to fetch request inquiries')
      }
    } catch (error) {
      console.error('Error fetching request inquiries:', error)
      toast.error('Failed to fetch request inquiries')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/request-inquiries/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchCoordinators = async () => {
    try {
      const response = await fetch('/api/users/basic')
      if (response.ok) {
        const data = await response.json()
        const filtered = data.filter((u: any) => 
          u.role === 'COORDINATOR' || 
          u.role === 'ADMIN' || 
          u.role === 'ADMINISTRATOR' || 
          u.role === 'DEVELOPER'
        )
        setCoordinators(filtered)
      }
    } catch (err) {
      console.error('Error fetching coordinators:', err)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns?limit=500&forInquiry=true')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const handleAssignCampaign = async (visitorId: string, campaignId: string) => {
    try {
      const response = await fetch(`/api/request-inquiries/${visitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaignId === 'none' ? null : campaignId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update campaign')
      }

      const selectedCampaign = campaigns.find((c) => c.id === campaignId)
      const updatedCampaignName = selectedCampaign ? selectedCampaign.name : null

      toast.success('Campaign updated')
      
      setRequestInquiries((prev) =>
        prev.map((inq) =>
          inq.id === visitorId
            ? { ...inq, campaignId: campaignId === 'none' ? null : campaignId, campaignName: updatedCampaignName }
            : inq
        )
      )

      setExpandedInquiries((prev) =>
        prev.map((inq) =>
          inq.visitorId === visitorId
            ? { ...inq, campaignId: campaignId === 'none' ? null : campaignId, campaignName: updatedCampaignName }
            : inq
        )
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to assign campaign')
    }
  }

  const handleAssignCoordinator = async (visitorId: string, coordinatorId: string) => {
    try {
      const response = await fetch(`/api/request-inquiries/${visitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinatorId: coordinatorId === 'none' ? null : coordinatorId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update coordinator')
      }

      const selectedUser = coordinators.find((c) => c.id === coordinatorId)
      const updatedCoordName = selectedUser ? selectedUser.name : null

      toast.success('Coordinator updated')
      
      setRequestInquiries((prev) =>
        prev.map((inq) =>
          inq.id === visitorId
            ? { ...inq, coordinatorId: coordinatorId === 'none' ? null : coordinatorId, coordinatorName: updatedCoordName }
            : inq
        )
      )

      setExpandedInquiries((prev) =>
        prev.map((inq) =>
          inq.visitorId === visitorId
            ? { ...inq, coordinatorId: coordinatorId === 'none' ? null : coordinatorId, coordinatorName: updatedCoordName }
            : inq
        )
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to assign coordinator')
    }
  }

  const handleUpdateAddressee = async (visitorId: string, addressee: string) => {
    try {
      const response = await fetch(`/api/request-inquiries/${visitorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressee: addressee.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update addressee')
      }

      toast.success('Addressee updated')

      setRequestInquiries((prev) =>
        prev.map((inq) =>
          inq.id === visitorId
            ? { ...inq, addressee: addressee.trim() || null }
            : inq
        )
      )

      setExpandedInquiries((prev) =>
        prev.map((inq) =>
          inq.visitorId === visitorId
            ? { ...inq, addressee: addressee.trim() || null }
            : inq
        )
      )
      setEditingAddresseeId(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update addressee')
    }
  }

  useEffect(() => {
    fetchRequestInquiries()
    fetchPrograms()
    fetchCoordinators()
    fetchCampaigns()
    // No automatic refresh interval
  }, [])

  // Debounce search term to avoid lag on fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm)
    }, 200)
    return () => clearTimeout(timer)
  }, [localSearchTerm])

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(50)
  }, [searchTerm, programFilter, campaignFilter, coordinatorFilter, statusFilter, dateRange])
  
  // Apply filters whenever search term, program filter, campaign filter, coordinator filter, status filter, or date range changes
  useEffect(() => {
    let filtered = [...expandedInquiries]
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (inq) =>
          inq.name.toLowerCase().includes(search) ||
          inq.workPhone.includes(search) ||
          inq.program.programName.toLowerCase().includes(search)
      )
    }
    
    // Program filter
    if (programFilter && programFilter !== 'all') {
      filtered = filtered.filter((inq) => inq.program.id.toString() === programFilter)
    }

    // Campaign filter
    if (campaignFilter && campaignFilter !== 'all') {
      if (campaignFilter === 'none') {
        filtered = filtered.filter((inq) => !inq.campaignId)
      } else {
        filtered = filtered.filter((inq) => inq.campaignId === campaignFilter)
      }
    }

    // Coordinator filter
    if (coordinatorFilter && coordinatorFilter !== 'all') {
      if (coordinatorFilter === 'none') {
        filtered = filtered.filter((inq) => !inq.coordinatorId)
      } else {
        filtered = filtered.filter((inq) => inq.coordinatorId === coordinatorFilter)
      }
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'converted') {
        filtered = filtered.filter((inq) => inq.isConverted)
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter((inq) => !inq.isConverted)
      }
    }
    
    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter((inq) => {
        const inquiryDate = new Date(inq.createdAt)
        const fromDate = new Date(dateRange.from!)
        fromDate.setHours(0, 0, 0, 0)
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
          return inquiryDate >= fromDate && inquiryDate <= toDate
        }
        
        return inquiryDate >= fromDate
      })
    }
    
    setFilteredInquiries(filtered)
  }, [searchTerm, programFilter, campaignFilter, coordinatorFilter, statusFilter, dateRange, expandedInquiries])

  const handleConvertToInquiry = (expandedInquiry: ExpandedRequestInquiry) => {
    if (expandedInquiry.isConverted) return
    
    // Find the original visitor with all programs
    const originalVisitor = requestInquiries.find((inq) => inq.id === expandedInquiry.visitorId)
    if (!originalVisitor) return
    
    // Open the dialog with pre-filled data and the selected program
    setSelectedVisitor(originalVisitor)
    setSelectedProgram(expandedInquiry.program)
    setIsDialogOpen(true)
  }

  const handleInquiryCreated = async (visitorId: string) => {
    try {
      // Mark the visitor as converted in the database
      const response = await fetch(`/api/request-inquiries/${visitorId}/mark-converted`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to mark visitor as converted' }))
        console.error('Error marking visitor as converted:', error)
        // Don't show error to user since inquiry was already created successfully
      }

      // Refresh the list to get updated data from database
      await fetchRequestInquiries(true)
    } catch (error) {
      console.error('Error marking visitor as converted:', error)
      // Don't show error to user since inquiry was already created successfully
    }
  }
  
  const handleRefresh = () => {
    fetchRequestInquiries(true)
  }
  
  const handleClearFilters = () => {
    setLocalSearchTerm('')
    setSearchTerm('')
    setProgramFilter('all')
    setCampaignFilter('all')
    setCoordinatorFilter('all')
    setStatusFilter('all')
    setDateRange(undefined)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSelectedVisitor(null)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Loading request inquiries...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Exhibition Registration Requests</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {filteredInquiries.length} {filteredInquiries.length === 1 ? 'request' : 'requests'}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImportOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or program..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'MMM dd, yyyy')
                      )
                    ) : (
                      <span>Filter by date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              {(localSearchTerm || programFilter !== 'all' || campaignFilter !== 'all' || coordinatorFilter !== 'all' || statusFilter !== 'all' || dateRange) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Program Filter */}
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.programName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Campaign Filter */}
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="none">No Campaign</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Coordinator Filter */}
              <Select value={coordinatorFilter} onValueChange={setCoordinatorFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by coordinator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coordinators</SelectItem>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {coordinators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Addressee</TableHead>
                <TableHead>Coordinator</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device Info</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    {expandedInquiries.length === 0 ? 'No exhibition registrations found' : 'No matching requests found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.slice(0, displayLimit).map((expandedInquiry) => {
                  const isConverting = convertingIds.has(expandedInquiry.visitorId)
                  const isConverted = expandedInquiry.isConverted
                  const location = expandedInquiry.metadata 
                    ? `${expandedInquiry.metadata.city || ''}${expandedInquiry.metadata.city && expandedInquiry.metadata.country ? ', ' : ''}${expandedInquiry.metadata.country || ''}`.trim() || '-'
                    : '-'
                  const deviceInfo = expandedInquiry.metadata
                    ? `${expandedInquiry.metadata.browser || 'Unknown'}${expandedInquiry.metadata.device ? ` • ${expandedInquiry.metadata.device}` : ''}`
                    : '-'
                  
                  return (
                    <TableRow
                      key={expandedInquiry.id}
                      className={
                        isConverted
                          ? 'bg-red-50 hover:bg-red-100 transition-colors'
                          : 'hover:bg-gray-50 transition-colors'
                      }
                    >
                      <TableCell className="font-medium">{expandedInquiry.name}</TableCell>
                      <TableCell>{expandedInquiry.workPhone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {expandedInquiry.program.programName}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        {editingAddresseeId === expandedInquiry.visitorId ? (
                          <Input
                            value={tempAddressee}
                            onChange={(e) => setTempAddressee(e.target.value)}
                            onBlur={() => handleUpdateAddressee(expandedInquiry.visitorId, tempAddressee)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateAddressee(expandedInquiry.visitorId, tempAddressee)
                              } else if (e.key === 'Escape') {
                                setEditingAddresseeId(null)
                              }
                            }}
                            autoFocus
                            className="h-8 py-1 text-xs"
                          />
                        ) : (
                          <div 
                            onClick={() => {
                              setEditingAddresseeId(expandedInquiry.visitorId)
                              setTempAddressee(expandedInquiry.addressee || '')
                            }}
                            className="cursor-pointer hover:bg-gray-100 p-1.5 rounded min-h-[30px] flex items-center text-sm text-gray-700 break-words"
                            title="Click to edit addressee"
                          >
                            {expandedInquiry.addressee || <span className="text-gray-400 italic text-xs font-normal">Add addressee</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <select
                          value={expandedInquiry.coordinatorId || 'none'}
                          onChange={(e) => handleAssignCoordinator(expandedInquiry.visitorId, e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="none">Unassigned</option>
                          {coordinators.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <select
                          value={expandedInquiry.campaignId || 'none'}
                          onChange={(e) => handleAssignCampaign(expandedInquiry.visitorId, e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="none">No Campaign</option>
                          {campaigns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        {expandedInquiry.metadata ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{location}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {deviceInfo}
                      </TableCell>
                      <TableCell>
                        {new Date(expandedInquiry.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(expandedInquiry.createdAt).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isConverted ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            Converted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleConvertToInquiry(expandedInquiry)}
                          disabled={isConverted || isConverting}
                          className={
                            isConverted
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : ''
                          }
                        >
                          {isConverting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : isConverted ? (
                            'Converted'
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Inquiry
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filteredInquiries.length > displayLimit && (
          <div className="flex justify-center p-4 border-t border-gray-200 bg-gray-50/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisplayLimit((prev) => prev + 50)}
              className="gap-2 font-medium"
            >
              Load More (Showing {displayLimit} of {filteredInquiries.length})
            </Button>
          </div>
        )}
      </CardContent>
      
      <NewInquiryDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        initialData={selectedVisitor ? {
          id: selectedVisitor.id,
          name: selectedVisitor.name,
          workPhone: selectedVisitor.workPhone,
          programs: selectedVisitor.programs,
          metadata: selectedVisitor.metadata,
          selectedProgram: selectedProgram,
          campaignId: selectedVisitor.campaignId,
          coordinatorId: selectedVisitor.coordinatorId,
        } : null}
        onInquiryCreated={handleInquiryCreated}
      />
      
      <ImportRequestInquiriesDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={() => fetchRequestInquiries(true)}
      />
    </Card>
  )
}
