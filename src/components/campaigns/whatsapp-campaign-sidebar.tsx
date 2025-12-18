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
import { 
  MessageSquare, 
  Users, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Phone,
  Mail,
  MapPin,
  X,
  Upload,
  Image,
  File,
  Trash2
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
      name: string
    }
  }>
}

interface WhatsAppCampaignSidebarProps {
  campaignId?: string
  onClose?: () => void
}

export function WhatsAppCampaignSidebar({ campaignId, onClose }: WhatsAppCampaignSidebarProps) {
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

  useEffect(() => {
    fetchSeekers()
  }, [campaignId])

  useEffect(() => {
    filterSeekers()
  }, [seekers, searchTerm])

  const fetchSeekers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inquiries')
      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        const inquiries: Seeker[] = Array.isArray(data) ? data : (data.inquiries || [])
        // Only WhatsApp-enabled inquiries (must have a WhatsApp number or fallback phone)
        const whatsappSeekers = inquiries.filter((seeker) => Boolean(seeker.whatsapp) && Boolean(seeker.whatsappNumber || seeker.phone))
        setSeekers(whatsappSeekers)
      }
    } catch (error) {
      console.error('Error fetching seekers:', error)
      setSendStatus({
        type: 'error',
        message: 'Failed to fetch inquiries'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterSeekers = () => {
    if (!searchTerm.trim()) {
      setFilteredSeekers(seekers)
      return
    }

    const filtered = seekers.filter(seeker =>
      seeker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seeker.phone.includes(searchTerm) ||
      seeker.whatsappNumber?.includes(searchTerm) ||
      seeker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seeker.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSeekers(filtered)
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
    if (file.type.startsWith('video/')) return <File className="h-4 w-4" />
    if (file.type.startsWith('audio/')) return <File className="h-4 w-4" />
    return <File className="h-4 w-4" />
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
      if (campaignId) formData.append('campaignId', campaignId)
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
      } else {
        setSendStatus({
          type: 'error',
          message: result.error || 'Failed to send messages'
        })
      }
    } catch (error) {
      console.error('Error sending messages:', error)
      setSendStatus({
        type: 'error',
        message: 'Failed to send messages. Please try again.'
      })
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">WhatsApp Campaign</h2>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Send bulk WhatsApp messages to selected inquiries
        </p>
      </div>

      {/* Message Composition */}
      <div className="p-4 border-b border-gray-200">
        <Label htmlFor="message" className="text-sm font-medium">
          Message Content
        </Label>
        <Textarea
          id="message"
          placeholder="Enter your WhatsApp message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 min-h-[100px]"
        />
        
        {/* Media Upload Section */}
        <div className="mt-4">
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

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {message.length} characters
          </span>
          <span className="text-xs text-gray-500">
            {selectedSeekers.size} selected
          </span>
        </div>
      </div>

      {/* Search and Selection */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={filteredSeekers.length > 0 && selectedSeekers.size === filteredSeekers.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm">
              Select All ({filteredSeekers.length})
            </Label>
          </div>
          <Badge variant="secondary">
            {selectedSeekers.size} selected
          </Badge>
        </div>
      </div>

      {/* Inquiries List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading inquiries...</p>
            </div>
          ) : filteredSeekers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchTerm ? 'No inquiries found matching your search' : 'No WhatsApp inquiries available'}
              </p>
            </div>
          ) : (
            filteredSeekers.map((seeker) => (
              <Card key={seeker.id} className={`p-3 cursor-pointer transition-colors ${
                selectedSeekers.has(seeker.id) 
                  ? 'bg-green-50 border-green-200' 
                  : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedSeekers.has(seeker.id)}
                    onCheckedChange={() => handleSelectSeeker(seeker.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">{seeker.fullName}</h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(seeker.createdAt)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{seeker.whatsappNumber || seeker.phone}</span>
                      </div>
                      
                      {seeker.email && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{seeker.email}</span>
                        </div>
                      )}
                      
                      {seeker.city && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{seeker.city}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {seeker.marketingSource}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Send Button and Status */}
      <div className="p-4 border-t border-gray-200">
        {sendStatus && (
          <Alert className={`mb-3 ${
            sendStatus.type === 'success' ? 'border-green-200 bg-green-50' :
            sendStatus.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center space-x-2">
              {sendStatus.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {sendStatus.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              {sendStatus.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-600" />}
              <AlertDescription className="text-sm">
                {sendStatus.message}
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        <Button 
          onClick={handleSendMessages}
          disabled={sending || selectedSeekers.size === 0 || (!message.trim() && !mediaFile)}
          className="w-full"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedSeekers.size} inquiries
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
