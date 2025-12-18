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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { safeJsonParse } from '@/lib/utils'
import { 
  Mail, 
  Send, 
  AlertCircle, 
  Search,
  Phone,
  MapPin,
  Upload,
  File,
  Trash2,
  RefreshCw,
  Filter,
  X,
  History,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Paperclip,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Seeker {
  id: string
  fullName: string
  phone: string
  email?: string
  city?: string
  marketingSource: string
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

interface EmailMessageHistory {
  id: string
  subject: string
  message: string
  attachmentCount?: number
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
    email: string
    status: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ'
    errorMessage?: string
    sentAt?: string
    seeker: {
      id: string
      fullName: string
      email: string
    }
  }>
}

export default function EmailCampaignPage() {
  const [seekers, setSeekers] = useState<Seeker[]>([])
  const [filteredSeekers, setFilteredSeekers] = useState<Seeker[]>([])
  const [selectedSeekers, setSelectedSeekers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [sendStatus, setSendStatus] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())
  const [showProgramFilter, setShowProgramFilter] = useState(false)
  const [messageHistory, setMessageHistory] = useState<EmailMessageHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null)
  const [previewEmail, setPreviewEmail] = useState<EmailMessageHistory | null>(null)

  useEffect(() => {
    fetchSeekers()
    fetchPrograms()
  }, [])

  useEffect(() => {
    let filtered = seekers.filter(seeker => seeker.email) // Only include seekers with email

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(seeker =>
        seeker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seeker.phone.includes(searchTerm) ||
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

    setFilteredSeekers(filtered)
  }, [seekers, searchTerm, selectedPrograms])

  const fetchSeekers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inquiries')
      if (response.ok) {
        const data = await safeJsonParse(response)
        const allSeekers = Array.isArray(data) ? data : (data.inquiries || [])
        // Filter to only include seekers with email addresses
        setSeekers(allSeekers.filter((s: Seeker) => s.email))
      }
    } catch (error) {
      console.error('Error fetching seekers:', error)
      setSeekers([])
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
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/email/history')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setMessageHistory(data.messages)
      }
    } catch (error) {
      console.error('Error fetching message history:', error)
    } finally {
      setHistoryLoading(false)
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

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Check total file size (max 25MB total for Gmail)
    const totalSize = [...attachments, ...files].reduce((sum, file) => sum + file.size, 0)
    if (totalSize > 25 * 1024 * 1024) {
      setSendStatus({
        type: 'error',
        message: 'Total attachment size must be less than 25MB'
      })
      return
    }

    setAttachments(prev => [...prev, ...files])
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendEmails = async () => {
    if (selectedSeekers.size === 0) {
      setSendStatus({
        type: 'error',
        message: 'Please select at least one inquiry to send emails'
      })
      return
    }

    if (!subject.trim()) {
      setSendStatus({
        type: 'error',
        message: 'Please enter an email subject'
      })
      return
    }

    if (!message.trim()) {
      setSendStatus({
        type: 'error',
        message: 'Please enter an email message'
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
      formData.append('subject', subject.trim())
      formData.append('message', message.trim())
      
      // Append attachments
      attachments.forEach((file, index) => {
        formData.append(`attachment-${index}`, file)
      })
      
      const response = await fetch('/api/email/bulk-send', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setSendStatus({
          type: 'success',
          message: `Successfully sent ${result.sentCount} emails. ${result.failedCount} failed.`
        })
        setSelectedSeekers(new Set())
        setSubject('')
        setMessage('')
        setAttachments([])
        // Automatically show and refresh history after sending
        setShowHistory(true)
        fetchHistory()
      } else {
        setSendStatus({
          type: 'error',
          message: result.error || 'Failed to send emails'
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

  const totalAttachmentSize = attachments.reduce((sum, file) => sum + file.size, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Email Campaign
              </h1>
              <p className="text-gray-600">
                Send bulk emails to inquiries via Gmail
              </p>
            </div>
          </div>
          <Button
            variant={showHistory ? "default" : "outline"}
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) {
                fetchHistory()
              }
            }}
            className="flex items-center space-x-2"
          >
            <History className="h-4 w-4" />
            <span>Email History</span>
            {messageHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {messageHistory.length}
              </Badge>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Composition */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium">
                    Email Subject *
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium">
                    Message Content *
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your email message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2 min-h-[160px]"
                  />
                </div>
                
                {/* Attachments Section */}
                <div>
                  <Label className="text-sm font-medium">Attachments (Optional)</Label>
                  <div className="mt-2 space-y-3">
                    {/* File Upload Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id="attachment-upload"
                        multiple
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="attachment-upload"
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm">Attach Files</span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {(totalAttachmentSize / 1024 / 1024).toFixed(1)} / 25 MB
                      </span>
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <File className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[150px]">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAttachment(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendEmails}
                  disabled={sending || selectedSeekers.size === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>With Email: {seekers.length} inquiries</span>
                  <span>Filtered: {filteredSeekers.length} inquiries</span>
                  <span>Selected: {selectedSeekers.size} inquiries</span>
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
                        No inquiries with email addresses found
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
                                {seeker.email && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Has Email
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(seeker.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-48">{seeker.email}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{seeker.phone}</span>
                              </div>
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

        {/* Email History Section */}
        {showHistory && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Email History</h2>
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
                  No email history found
                </div>
              ) : (
                <div className="space-y-4">
                  {messageHistory.map((email) => (
                    <div key={email.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-lg">
                              {email.subject}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewEmail(email)}
                                className="flex items-center space-x-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Preview</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedEmailId(expandedEmailId === email.id ? null : email.id)}
                                className="flex items-center space-x-1"
                              >
                                {expandedEmailId === email.id ? (
                                  <>
                                    <ChevronUp className="h-4 w-4" />
                                    <span>Collapse</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4" />
                                    <span>Expand</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className={`text-sm text-gray-600 ${expandedEmailId === email.id ? '' : 'line-clamp-3'}`}>
                            {email.message}
                          </div>
                          <div className="flex items-center flex-wrap gap-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(email.sentAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>Sent by: {email.user.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="font-medium text-green-700">{email.sentCount} sent</span>
                            </div>
                            {email.failedCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <XCircle className="h-3 w-3 text-red-600" />
                                <span className="font-medium text-red-700">{email.failedCount} failed</span>
                              </div>
                            )}
                            {email.attachmentCount && email.attachmentCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <Paperclip className="h-3 w-3" />
                                <span>{email.attachmentCount} attachment{email.attachmentCount > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{email.recipientCount} recipient{email.recipientCount > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Recipients List */}
                      {(expandedEmailId === email.id || email.recipients.length <= 5) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Recipients ({email.recipients.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {email.recipients.map((recipient) => (
                              <div key={recipient.id} className="flex items-center space-x-2 text-sm p-2 bg-gray-50 rounded">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  recipient.status === 'SENT' ? 'bg-green-500' :
                                  recipient.status === 'FAILED' ? 'bg-red-500' :
                                  recipient.status === 'DELIVERED' ? 'bg-blue-500' :
                                  recipient.status === 'READ' ? 'bg-purple-500' :
                                  'bg-gray-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-700 truncate">{recipient.seeker.fullName}</div>
                                  <div className="text-xs text-gray-500 truncate">{recipient.email}</div>
                                  {recipient.errorMessage && (
                                    <div className="text-xs text-red-600 mt-1">{recipient.errorMessage}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {expandedEmailId !== email.id && email.recipients.length > 5 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedEmailId(email.id)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Show all {email.recipients.length} recipients
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Email Preview Dialog */}
        <Dialog open={!!previewEmail} onOpenChange={() => setPreviewEmail(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{previewEmail?.subject}</DialogTitle>
              <DialogDescription>
                Email sent on {previewEmail ? new Date(previewEmail.sentAt).toLocaleString() : ''} by {previewEmail?.user.name}
              </DialogDescription>
            </DialogHeader>
            {previewEmail && (
              <div className="space-y-4">
                {/* Email Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Recipients</div>
                    <div className="text-sm text-gray-900">{previewEmail.recipientCount}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Status</div>
                    <div className="text-sm text-gray-900">
                      <span className="text-green-600 font-medium">{previewEmail.sentCount} sent</span>
                      {previewEmail.failedCount > 0 && (
                        <span className="text-red-600 font-medium ml-2">{previewEmail.failedCount} failed</span>
                      )}
                    </div>
                  </div>
                  {previewEmail.attachmentCount && previewEmail.attachmentCount > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Attachments</div>
                      <div className="text-sm text-gray-900">{previewEmail.attachmentCount} file(s)</div>
                    </div>
                  )}
                </div>

                {/* Email Content Preview */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>From:</strong> {previewEmail.user.name} ({previewEmail.user.email})
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Subject:</strong> {previewEmail.subject}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Sent:</strong> {new Date(previewEmail.sentAt).toLocaleString()}
                    </div>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: previewEmail.message.split('\n').map(line => `<p>${line}</p>`).join('') 
                    }}
                  />
                </div>

                {/* Recipients List */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Recipients ({previewEmail.recipients.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {previewEmail.recipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            recipient.status === 'SENT' ? 'bg-green-500' :
                            recipient.status === 'FAILED' ? 'bg-red-500' :
                            recipient.status === 'DELIVERED' ? 'bg-blue-500' :
                            recipient.status === 'READ' ? 'bg-purple-500' :
                            'bg-gray-400'
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{recipient.seeker.fullName}</div>
                            <div className="text-xs text-gray-500">{recipient.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            recipient.status === 'SENT' ? 'default' :
                            recipient.status === 'FAILED' ? 'destructive' :
                            'secondary'
                          }>
                            {recipient.status}
                          </Badge>
                          {recipient.errorMessage && (
                            <div className="text-xs text-red-600 max-w-xs truncate" title={recipient.errorMessage}>
                              {recipient.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

