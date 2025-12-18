'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { safeJsonParse } from '@/lib/utils'
import { format, endOfDay, startOfDay } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Search,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  Upload,
  Image,
  File as FileIcon,
  Trash2,
  RefreshCw,
  ChevronDown,
  Filter,
  X,
  History,
  Clock,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react'

interface Seeker {
  id: string
  fullName: string
  phone: string
  whatsapp: boolean
  whatsappNumber?: string
  email?: string
  city?: string
  marketingSource: string
  campaignId?: string
  createdAt: string
  preferredPrograms?: Array<{
    program: {
      id: string
      name: string
    }
  }>
}

interface Program {
  id: string
  name: string
  description?: string
}

interface WhatsAppMessageHistory {
  id: string
  message: string
  mediaType?: string
  mediaFilename?: string
  mediaFilePath?: string
  mediaSize?: number
  recipientCount: number
  sentCount: number
  failedCount: number
  sentAt: string
  user: {
    id: string
    name: string
    email: string
  }
  recipients: Array<{
    id: string
    phoneNumber: string
    status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ'
    errorMessage?: string
    sentAt?: string
    seeker: {
      id: string
      fullName: string
      phone: string
    }
  }>
}

interface WhatsAppTemplate {
  id: string
  name: string
  content: string
  mediaType?: string
  mediaFilename?: string
  mediaFilePath?: string
  mediaSize?: number
  userId: string
  createdAt: string
  updatedAt: string
}

export default function WhatsAppCampaignPage() {
  const [seekers, setSeekers] = useState<Seeker[]>([])
  const [filteredSeekers, setFilteredSeekers] = useState<Seeker[]>([])
  const [selectedSeekers, setSelectedSeekers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [sendStatus, setSendStatus] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())
  const [showProgramFilter, setShowProgramFilter] = useState(false)
  const [messageHistory, setMessageHistory] = useState<WhatsAppMessageHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Templates
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none')
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [templateImageFile, setTemplateImageFile] = useState<File | null>(null)
  const [templateImagePreview, setTemplateImagePreview] = useState<string | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)

  useEffect(() => {
    fetchSeekers()
    fetchPrograms()
    fetchTemplates()
  }, [])

  useEffect(() => {
    let filtered = seekers

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(seeker =>
        seeker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.phone.includes(searchTerm) ||
        seeker.whatsappNumber?.includes(searchTerm) ||
        seeker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by selected programs
    if (selectedPrograms.size > 0) {
      filtered = filtered.filter(seeker =>
        seeker.preferredPrograms?.some(pref => 
          selectedPrograms.has(pref.program.id)
        )
      )
    }

    // Filter by created date range
    if (dateRange?.from || dateRange?.to) {
      const from = dateRange?.from ? startOfDay(dateRange.from) : null
      const to = dateRange?.to ? endOfDay(dateRange.to) : null

      filtered = filtered.filter(seeker => {
        const createdAt = new Date(seeker.createdAt)
        if (Number.isNaN(createdAt.getTime())) return false
        if (from && createdAt < from) return false
        if (to && createdAt > to) return false
        return true
      })
    }

    setFilteredSeekers(filtered)
  }, [seekers, searchTerm, selectedPrograms, dateRange])

  const fetchSeekers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inquiries')
      if (response.ok) {
        const data = await safeJsonParse(response)
        console.log('Fetched inquiries:', data)
        // API returns { inquiries: [], pagination: {} }, so we need to extract the inquiries array
        const inquiries: Seeker[] = Array.isArray(data) ? data : (data.inquiries || [])
        // Only show WhatsApp-enabled inquiries (otherwise bulk-send will fail / send to wrong numbers)
        const whatsappInquiries = inquiries.filter((s) => Boolean(s.whatsapp) && Boolean(s.whatsappNumber || s.phone))
        setSeekers(whatsappInquiries)
      } else {
        console.error('Failed to fetch inquiries:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching seekers:', error)
      setSeekers([]) // Ensure seekers is always an array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setPrograms(data)
      } else {
        console.error('Failed to fetch programs:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/whatsapp/history')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setMessageHistory(data.messages)
      } else {
        console.error('Failed to fetch message history:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching message history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true)
      const response = await fetch('/api/whatsapp/templates')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to fetch templates:', response.status, response.statusText)
        setTemplates([])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplateId(value)
    if (value === 'none') {
      setMessage('')
      setMediaFile(null)
      setMediaPreview(null)
      setSendStatus(null)
      return
    }
    const template = templates.find((t) => t.id === value)
    if (template) {
      setMessage(template.content)

      // If template has an image, fetch it and attach so Send works with existing flow
      if (template.mediaFilePath && template.mediaType?.startsWith('image/')) {
        const mediaPath = template.mediaFilePath
        ;(async () => {
          try {
            const res = await fetch(mediaPath)
            if (!res.ok) return
            const blob = await res.blob()
            const fileName = template.mediaFilename || 'template-image'
            const file = new File([blob], fileName, { type: template.mediaType || blob.type })
            setMediaFile(file)
            setMediaPreview(mediaPath)
          } catch (e) {
            console.error('Failed to load template image:', e)
          }
        })()
      }
    }
  }

  const handleOpenTemplateDialog = () => {
    setTemplateError(null)
    setTemplateName('')
    setTemplateContent(message || '')
    setTemplateImageFile(null)
    setTemplateImagePreview(null)
    setIsTemplateDialogOpen(true)
  }

  const handleTemplateImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      setTemplateImageFile(null)
      setTemplateImagePreview(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setTemplateError('Please select an image file')
      return
    }
    if (file.size > 16 * 1024 * 1024) {
      setTemplateError('Image must be less than 16MB')
      return
    }
    setTemplateImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setTemplateImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveTemplate = async () => {
    const name = templateName.trim()
    const content = templateContent
    if (!name) {
      setTemplateError('Template name is required')
      return
    }
    if (!content.trim()) {
      setTemplateError('Template content is required')
      return
    }

    try {
      setTemplateSaving(true)
      setTemplateError(null)
      const formData = new FormData()
      formData.append('name', name)
      formData.append('content', content)
      if (templateImageFile) formData.append('media', templateImageFile)

      const response = await fetch('/api/whatsapp/templates', { method: 'POST', body: formData })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setTemplateError(result.error || 'Failed to save template')
        return
      }

      // Refresh and auto-select
      await fetchTemplates()
      if (result?.template?.id) {
        setSelectedTemplateId(result.template.id)
        setMessage(result.template.content)
        if (result.template.mediaFilePath && result.template.mediaType?.startsWith('image/')) {
          try {
            const res = await fetch(result.template.mediaFilePath)
            if (res.ok) {
              const blob = await res.blob()
              const fileName = result.template.mediaFilename || 'template-image'
              const file = new File([blob], fileName, { type: result.template.mediaType || blob.type })
              setMediaFile(file)
              setMediaPreview(result.template.mediaFilePath)
            }
          } catch (e) {
            console.error('Failed to load saved template image:', e)
          }
        }
      }
      setIsTemplateDialogOpen(false)
    } catch (error) {
      console.error('Error saving template:', error)
      setTemplateError('Network error. Please try again.')
    } finally {
      setTemplateSaving(false)
    }
  }


  const handleSelectAll = () => {
    if (selectedSeekers.size === filteredSeekers.length) {
      setSelectedSeekers(new Set())
    } else {
      setSelectedSeekers(new Set(filteredSeekers.map(seeker => seeker.id)))
    }
  }

  const handleSelectSeeker = (seekerId: string) => {
    const newSelected = new Set(selectedSeekers)
    if (newSelected.has(seekerId)) {
      newSelected.delete(seekerId)
    } else {
      newSelected.add(seekerId)
    }
    setSelectedSeekers(newSelected)
  }

  const handleSelectProgram = (programId: string) => {
    const newSelected = new Set(selectedPrograms)
    if (newSelected.has(programId)) {
      newSelected.delete(programId)
    } else {
      newSelected.add(programId)
    }
    setSelectedPrograms(newSelected)
  }

  const handleClearProgramFilters = () => {
    setSelectedPrograms(new Set())
  }

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 16MB for WhatsApp)
      if (file.size > 16 * 1024 * 1024) {
        setSendStatus({
          type: 'error',
          message: 'File size must be less than 16MB'
        })
        return
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setSendStatus({
          type: 'error',
          message: 'File type not supported. Please use images, videos, audio, or documents.'
        })
        return
      }

      setMediaFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setMediaPreview(null)
      }
    }
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.startsWith('video/')) return <FileIcon className="h-4 w-4" />
    if (file.type.startsWith('audio/')) return <FileIcon className="h-4 w-4" />
    return <FileIcon className="h-4 w-4" />
  }

  const handleSendMessages = async () => {
    if (selectedSeekers.size === 0) {
      setSendStatus({
        type: 'error',
        message: 'Please select at least one inquiry to send messages'
      })
      return
    }

    if (!message.trim() && !mediaFile) {
      setSendStatus({
        type: 'error',
        message: 'Please enter a message or attach a media file'
      })
      return
    }

    try {
      setSending(true)
      setSendStatus(null)

      const selectedSeekersData = seekers.filter(seeker => selectedSeekers.has(seeker.id))
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('seekers', JSON.stringify(selectedSeekersData))
      formData.append('message', message.trim())
      if (mediaFile) formData.append('media', mediaFile)
      
      const response = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setSendStatus({
          type: 'success',
          message: `Successfully sent ${result.sentCount} messages. ${result.failedCount} failed.`
        })
        setSelectedSeekers(new Set())
        setMessage('')
        setMediaFile(null)
        setMediaPreview(null)
        // Refresh history after sending
        if (showHistory) {
          fetchHistory()
        }
      } else {
        setSendStatus({
          type: 'error',
          message: result.error || 'Failed to send messages'
        })
      }
    } catch (error) {
      setSendStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                WhatsApp Campaign
              </h1>
              <p className="text-gray-600">
                Send bulk WhatsApp messages to inquiries
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) {
                fetchHistory()
              }
            }}
            className="flex items-center space-x-2"
          >
            <History className="h-4 w-4" />
            <span>Message History</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Composition */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="space-y-6">
                {/* Templates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Message Template</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenTemplateDialog}
                      >
                        Add Template
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={templatesLoading}
                      onClick={() => setIsTemplateGalleryOpen(true)}
                      className="w-full justify-between"
                      title="Select template (opens gallery)"
                    >
                      <span className="truncate">
                        {templatesLoading
                          ? 'Loading templates...'
                          : selectedTemplateId === 'none'
                            ? 'Select a template'
                            : (templates.find((t) => t.id === selectedTemplateId)?.name || 'Select a template')}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={fetchTemplates}
                      disabled={templatesLoading}
                      className="shrink-0"
                      title="Refresh templates"
                    >
                      <RefreshCw className={`h-4 w-4 ${templatesLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium">
                    Message Content
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your WhatsApp message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2 min-h-[120px]"
                  />
                </div>
                
                {/* Media Upload Section */}
                <div>
                  <Label className="text-sm font-medium">Media Attachment (Optional)</Label>
                  <div className="mt-2 space-y-3">
                    {/* File Upload Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="media-upload"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="media-upload"
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Choose Media File</span>
                      </label>
                    </div>

                    {/* Media Preview */}
                    {mediaFile && (
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(mediaFile)}
                            <div>
                              <p className="text-sm font-medium">{mediaFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveMedia}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Image Preview */}
                        {mediaPreview && (
                          <div className="mt-2">
                            <img
                              src={mediaPreview}
                              alt="Media preview"
                              className="max-w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessages}
                  disabled={sending || selectedSeekers.size === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {sending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Send to {selectedSeekers.size} Selected</span>
                    </div>
                  )}
                </Button>

                {/* Status Messages */}
                {sendStatus && (
                  <Alert className={sendStatus.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className={sendStatus.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                      {sendStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </div>

          {/* Inquiry Selection */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, phone, email, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {dateRange?.from
                            ? dateRange?.to
                              ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                              : format(dateRange.from, 'MMM d, yyyy')
                            : 'Date'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        numberOfMonths={2}
                        selected={dateRange}
                        onSelect={setDateRange}
                        initialFocus
                      />
                      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          {dateRange?.from ? format(dateRange.from, 'MMM d, yyyy') : 'Start date'}
                          {dateRange?.to ? ` → ${format(dateRange.to, 'MMM d, yyyy')}` : ''}
                        </div>
                        {(dateRange?.from || dateRange?.to) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setDateRange(undefined)}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProgramFilter(!showProgramFilter)}
                    className="flex items-center space-x-1"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Programs</span>
                    {selectedPrograms.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {selectedPrograms.size}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSeekers}
                    disabled={loading}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>

                {/* Program Filter Dropdown */}
                {showProgramFilter && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Filter by Programs</h3>
                      <div className="flex items-center space-x-2">
                        {selectedPrograms.size > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearProgramFilters}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Clear All
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowProgramFilter(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {programs.map((program) => (
                        <div key={program.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`program-${program.id}`}
                            checked={selectedPrograms.has(program.id)}
                            onCheckedChange={() => handleSelectProgram(program.id)}
                          />
                          <Label 
                            htmlFor={`program-${program.id}`} 
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            {program.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedPrograms.size > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(selectedPrograms).map(programId => {
                            const program = programs.find(p => p.id === programId)
                            return program ? (
                              <Badge key={programId} variant="secondary" className="text-xs">
                                {program.name}
                                <button
                                  onClick={() => handleSelectProgram(programId)}
                                  className="ml-1 hover:text-red-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total: {seekers.length} inquiries</span>
                  <span>Filtered: {filteredSeekers.length} inquiries</span>
                  <span>Selected: {selectedSeekers.size} inquiries</span>
                  {selectedPrograms.size > 0 && (
                    <span className="text-blue-600">
                      {selectedPrograms.size} program{selectedPrograms.size > 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                {/* Select All */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedSeekers.size === filteredSeekers.length && filteredSeekers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({filteredSeekers.length} inquiries)
                  </Label>
                </div>

                {/* Inquiry List */}
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : filteredSeekers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No inquiries found
                      </div>
                    ) : (
                      filteredSeekers.map((seeker) => (
                        <div
                          key={seeker.id}
                          className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            id={`seeker-${seeker.id}`}
                            checked={selectedSeekers.has(seeker.id)}
                            onCheckedChange={() => handleSelectSeeker(seeker.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {seeker.fullName}
                                </h3>
                                {seeker.whatsapp && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    WhatsApp
                                  </Badge>
                                )}
                                {seeker.preferredPrograms && seeker.preferredPrograms.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {seeker.preferredPrograms.length} program{seeker.preferredPrograms.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(seeker.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{seeker.whatsappNumber || seeker.phone}</span>
                              </div>
                              {seeker.email && (
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-32">{seeker.email}</span>
                                </div>
                              )}
                              {seeker.city && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{seeker.city}</span>
                                </div>
                              )}
                            </div>
                            {seeker.preferredPrograms && seeker.preferredPrograms.length > 0 && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {seeker.preferredPrograms.slice(0, 2).map((pref, index) => (
                                    <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                      {pref.program.name}
                                    </span>
                                  ))}
                                  {seeker.preferredPrograms.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{seeker.preferredPrograms.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>
        </div>

        {/* Message History Section */}
        {showHistory && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Message History</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : messageHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No message history found
                </div>
              ) : (
                <div className="space-y-4">
                  {messageHistory.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {message.message.length > 100 
                                ? `${message.message.substring(0, 100)}...` 
                                : message.message}
                            </h3>
                            {message.mediaType && (
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="text-xs">
                                  {message.mediaType.split('/')[0]}
                                </Badge>
                                {message.mediaFilePath && (
                                  <a
                                    href={message.mediaFilePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  >
                                    View Media
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(message.sentAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Sent by: {message.user.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>{message.sentCount} sent</span>
                            </div>
                            {message.failedCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <XCircle className="h-3 w-3 text-red-600" />
                                <span>{message.failedCount} failed</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Media Preview */}
                      {message.mediaFilePath && message.mediaType && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Media</h4>
                          <div className="flex items-center space-x-2">
                            {message.mediaType.startsWith('image/') ? (
                              <img
                                src={message.mediaFilePath}
                                alt={message.mediaFilename || 'Media'}
                                className="max-w-32 max-h-32 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                                <FileIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {message.mediaFilename || 'Media file'}
                                </span>
                              </div>
                            )}
                            <a
                              href={message.mediaFilePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              Open in new tab
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Recipients */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Recipients ({message.recipients.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {message.recipients.map((recipient) => (
                            <div key={recipient.id} className="flex items-center space-x-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                recipient.status === 'SENT' ? 'bg-green-500' :
                                recipient.status === 'FAILED' ? 'bg-red-500' :
                                recipient.status === 'DELIVERED' ? 'bg-blue-500' :
                                recipient.status === 'READ' ? 'bg-purple-500' :
                                'bg-gray-400'
                              }`} />
                              <span className="text-gray-600">{recipient.seeker.fullName}</span>
                              <span className="text-gray-400">({recipient.phoneNumber})</span>
                              {recipient.errorMessage && (
                                <span className="text-red-500 text-xs">
                                  {recipient.errorMessage}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Add Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add WhatsApp Message Template</DialogTitle>
            <DialogDescription>
              Save a reusable message. After saving, you can select it and send.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Welcome message"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Template content</Label>
              <Textarea
                id="template-content"
                placeholder="Type template message..."
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-image">Template image (optional)</Label>
              <Input
                id="template-image"
                type="file"
                accept="image/*"
                onChange={handleTemplateImageChange}
              />
              {templateImagePreview && (
                <img
                  src={templateImagePreview}
                  alt="Template preview"
                  className="max-w-full h-32 object-cover rounded border"
                />
              )}
            </div>

            {templateError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{templateError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
              disabled={templateSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveTemplate} disabled={templateSaving}>
              {templateSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Gallery Dialog */}
      <Dialog open={isTemplateGalleryOpen} onOpenChange={setIsTemplateGalleryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Templates Gallery</DialogTitle>
            <DialogDescription>
              Click a template “post” to load it into the message box (and image if available).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templatesLoading ? (
              <div className="col-span-full text-sm text-gray-500">Loading templates...</div>
            ) : (
              <>
                <button
                  key="none"
                  type="button"
                  onClick={() => {
                    handleTemplateSelect('none')
                    setIsTemplateGalleryOpen(false)
                  }}
                  className="text-left border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <MessageSquare className="h-8 w-8" />
                      <span className="text-xs mt-1">No template</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm text-gray-900 truncate">None</div>
                    <div className="text-xs text-gray-600 mt-1">Clear template selection</div>
                  </div>
                </button>

                {templates.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500">No templates yet.</div>
                ) : (
                  templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        handleTemplateSelect(t.id)
                        setIsTemplateGalleryOpen(false)
                      }}
                      className="text-left border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {t.mediaFilePath && t.mediaType?.startsWith('image/') ? (
                          <img
                            src={t.mediaFilePath}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Image className="h-8 w-8" />
                            <span className="text-xs mt-1">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-sm text-gray-900 truncate">{t.name}</div>
                        <div className="text-xs text-gray-600 line-clamp-2 mt-1 whitespace-pre-wrap">
                          {t.content}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
