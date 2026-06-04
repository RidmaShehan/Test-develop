'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { safeJsonParse, dataUrlToFile } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Send, 
  AlertCircle, 
  Search,
  Phone,
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
  Gift,
  Pencil
} from 'lucide-react'

/** Inquiry (WhatsApp-enabled) or a promotion-code promoter row */
interface CampaignRecipient {
  id: string
  fullName: string
  phone: string
  whatsapp: boolean
  whatsappNumber?: string
  email?: string
  city?: string
  marketingSource: string
  campaignId?: string
  promotionCodeId?: string | null
  promotionCode?: { id: string; code: string } | null
  createdAt: string
  source: 'inquiry' | 'promotion'
  /** When source is promotion: the code string (e.g. A0001) */
  promoCodeLabel?: string
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
  /** Data URL (data:image/...;base64,...) when image is stored in the database */
  mediaBase64?: string | null
  mediaSize?: number
  userId: string
  createdAt: string
  updatedAt: string
}

const MAX_WHATSAPP_MESSAGE_LENGTH = 1024

async function fetchAllInquiryRecipients(): Promise<CampaignRecipient[]> {
  const allInquiries: CampaignRecipient[] = []
  const limit = 100
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await fetch(`/api/inquiries?page=${page}&limit=${limit}`)
    if (!response.ok) {
      console.error('Failed to fetch inquiries:', response.status, response.statusText)
      break
    }
    const data = await safeJsonParse(response)
    const inquiries: CampaignRecipient[] = Array.isArray(data) ? data : (data.inquiries || [])
    allInquiries.push(
      ...inquiries.map((row) => ({ ...row, source: 'inquiry' as const }))
    )
    const pagination = data?.pagination
    hasMore = pagination?.hasMore === true && inquiries.length === limit
    page += 1
  }

  return allInquiries.filter(
    (s) => Boolean(s.whatsapp) && Boolean(s.whatsappNumber || s.phone)
  )
}

function seekerSearchRowToRecipient(s: {
  id: string
  fullName: string | null
  phone: string | null
  whatsapp?: boolean
  whatsappNumber?: string | null
  email?: string | null
  city?: string | null
  marketingSource?: string | null
  createdAt?: string
  preferredPrograms?: CampaignRecipient['preferredPrograms']
}): CampaignRecipient | null {
  const phone = (s.phone || '').trim()
  const wa = (s.whatsappNumber || '').trim()
  const num = wa || phone
  if (!num) return null
  return {
    id: s.id,
    fullName: s.fullName?.trim() || 'Inquiry',
    phone: phone || wa,
    whatsapp: Boolean(s.whatsapp),
    whatsappNumber: wa || phone,
    email: s.email || undefined,
    city: s.city || undefined,
    marketingSource: s.marketingSource?.trim() || '—',
    createdAt: s.createdAt || new Date().toISOString(),
    source: 'inquiry',
    preferredPrograms: s.preferredPrograms,
  }
}

async function fetchAllPromotionRecipients(): Promise<CampaignRecipient[]> {
  const list: CampaignRecipient[] = []
  const limit = 100
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await fetch(`/api/promotion-codes?page=${page}&limit=${limit}`)
    if (!response.ok) {
      console.error('Failed to fetch promotion codes:', response.status, response.statusText)
      break
    }
    const data = await safeJsonParse(response)
    const codes = Array.isArray(data?.promotionCodes) ? data.promotionCodes : []
    totalPages = Math.max(1, data?.pagination?.totalPages ?? 1)

    for (const c of codes) {
      const phone = (c.promoterPhone as string)?.trim() || ''
      if (!phone) continue
      list.push({
        id: c.id as string,
        fullName: (c.promoterName as string) || 'Promoter',
        phone,
        whatsappNumber: phone,
        whatsapp: true,
        marketingSource: 'PROMOTION_CODE',
        createdAt: (c.createdAt as string) || new Date().toISOString(),
        source: 'promotion',
        promoCodeLabel: c.code as string,
        promotionCodeId: c.id as string,
      })
    }
    page += 1
  }

  return list
}

export default function WhatsAppCampaignPage() {
  /** Loaded from API (inquiries or promotion list) */
  const [fetchedSeekers, setFetchedSeekers] = useState<CampaignRecipient[]>([])
  /** Inquiries added via “Add existing inquiry” search (merged when not in Promo mode) */
  const [extraInquiryRecipients, setExtraInquiryRecipients] = useState<CampaignRecipient[]>([])
  const [existingInquirySearch, setExistingInquirySearch] = useState('')
  const [existingInquiryResults, setExistingInquiryResults] = useState<
    Array<Parameters<typeof seekerSearchRowToRecipient>[0]>
  >([])
  const [existingInquirySearching, setExistingInquirySearching] = useState(false)
  const existingSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [filteredSeekers, setFilteredSeekers] = useState<CampaignRecipient[]>([])
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
  const [promotionCodeHoldersOnly, setPromotionCodeHoldersOnly] = useState(false)
  const [messageHistory, setMessageHistory] = useState<WhatsAppMessageHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const seekers = useMemo(() => {
    if (promotionCodeHoldersOnly) return fetchedSeekers
    const map = new Map<string, CampaignRecipient>()
    for (const r of fetchedSeekers) map.set(r.id, r)
    for (const r of extraInquiryRecipients) map.set(r.id, r)
    return Array.from(map.values())
  }, [promotionCodeHoldersOnly, fetchedSeekers, extraInquiryRecipients])

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
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  /** Whether the template being edited had an image before opening the dialog */
  const [editingHadImage, setEditingHadImage] = useState(false)
  const [templateRemoveImage, setTemplateRemoveImage] = useState(false)

  /** Ignore stale async fetches when the user switches templates quickly */
  const templateMediaLoadSeq = useRef(0)

  useEffect(() => {
    fetchPrograms()
    fetchTemplates()
    fetchHistory()
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadSeekers = async () => {
      try {
        setLoading(true)
        const rows = promotionCodeHoldersOnly
          ? await fetchAllPromotionRecipients()
          : await fetchAllInquiryRecipients()
        if (cancelled) return
        setFetchedSeekers(rows)
      } catch (error) {
        console.error('Error fetching recipients:', error)
        if (!cancelled) setFetchedSeekers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSeekers()
    return () => {
      cancelled = true
    }
  }, [promotionCodeHoldersOnly])

  useEffect(() => {
    if (promotionCodeHoldersOnly) {
      setExtraInquiryRecipients([])
      setExistingInquirySearch('')
      setExistingInquiryResults([])
    }
  }, [promotionCodeHoldersOnly])

  useEffect(() => {
    if (promotionCodeHoldersOnly || existingInquirySearch.trim().length < 2) {
      setExistingInquiryResults([])
      return
    }
    if (existingSearchTimeoutRef.current) {
      clearTimeout(existingSearchTimeoutRef.current)
    }
    existingSearchTimeoutRef.current = setTimeout(async () => {
      setExistingInquirySearching(true)
      try {
        const q = existingInquirySearch.trim()
        const response = await fetch(
          `/api/seekers/search?q=${encodeURIComponent(q)}&limit=12`
        )
        if (!response.ok) {
          setExistingInquiryResults([])
          return
        }
        const data = await safeJsonParse(response)
        setExistingInquiryResults(Array.isArray(data?.seekers) ? data.seekers : [])
      } catch {
        setExistingInquiryResults([])
      } finally {
        setExistingInquirySearching(false)
      }
    }, 400)
    return () => {
      if (existingSearchTimeoutRef.current) {
        clearTimeout(existingSearchTimeoutRef.current)
      }
    }
  }, [existingInquirySearch, promotionCodeHoldersOnly])

  useEffect(() => {
    let filtered = seekers

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter((r) => {
        const codeStr = (r.promoCodeLabel || r.promotionCode?.code || '').toLowerCase()
        return (
          (r.fullName || '').toLowerCase().includes(q) ||
          r.phone.includes(searchTerm) ||
          r.whatsappNumber?.includes(searchTerm) ||
          r.email?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          codeStr.includes(q)
        )
      })
    }

    if (selectedPrograms.size > 0 && !promotionCodeHoldersOnly) {
      filtered = filtered.filter((r) =>
        r.preferredPrograms?.some((pref) => selectedPrograms.has(pref.program.id))
      )
    }

    setFilteredSeekers(filtered)
  }, [seekers, searchTerm, selectedPrograms, promotionCodeHoldersOnly])

  // Keep selection valid while filters/data change.
  // This prevents stale hidden recipients from being sent by accident.
  useEffect(() => {
    setSelectedSeekers((prev) => {
      if (prev.size === 0) return prev
      const validIds = new Set(filteredSeekers.map((s) => s.id))
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filteredSeekers])

  const selectedRecipients = useMemo(
    () => filteredSeekers.filter((s) => selectedSeekers.has(s.id)),
    [filteredSeekers, selectedSeekers]
  )

  const primaryRecipient = selectedRecipients[0] ?? null
  const messageLength = message.trim().length
  const isMessageTooLong = messageLength > MAX_WHATSAPP_MESSAGE_LENGTH

  const previewMessage = useMemo(() => {
    const baseMessage = message.trim()
    if (!baseMessage) return ''
    const preferredProgram = primaryRecipient?.preferredPrograms?.[0]?.program?.name ?? 'Your Program'
    return baseMessage
      .replaceAll('{{StudentName}}', primaryRecipient?.fullName ?? 'Student')
      .replaceAll('{{ProgramName}}', preferredProgram)
      .replaceAll('{{InquiryID}}', primaryRecipient?.id ?? 'INQ-0000')
      .replaceAll('{{CounselorName}}', 'Admissions Team')
  }, [message, primaryRecipient])

  const replyPreviewMessage = useMemo(() => {
    if (!previewMessage) return ''

    const lower = previewMessage.toLowerCase()
    const preferredProgram = primaryRecipient?.preferredPrograms?.[0]?.program?.name ?? 'the program'
    const firstName = primaryRecipient?.fullName?.split(' ')[0] ?? 'Hi'

    if (lower.includes('schedule') || lower.includes('call')) {
      return `Thanks ${firstName}! I am interested. Can we schedule a quick call tomorrow?`
    }

    if (lower.includes('fee') || lower.includes('payment') || lower.includes('cost')) {
      return `Thank you. Could you share the fee details and payment options for ${preferredProgram}?`
    }

    if (lower.includes('intake') || lower.includes('start date') || lower.includes('start')) {
      return `Thanks for the update. Please confirm the next intake date and required documents.`
    }

    return `Thank you for the message. I am interested in ${preferredProgram}. Please share the next steps.`
  }, [previewMessage, primaryRecipient])

  const isAllFilteredSelected =
    filteredSeekers.length > 0 && selectedRecipients.length === filteredSeekers.length

  const handleAddExistingInquiry = (
    row: Parameters<typeof seekerSearchRowToRecipient>[0]
  ) => {
    if (!row.whatsapp) {
      toast.error('This inquiry is not marked as WhatsApp-enabled.')
      return
    }
    const rec = seekerSearchRowToRecipient(row)
    if (!rec) {
      toast.error('That inquiry has no phone number on file.')
      return
    }
    setExtraInquiryRecipients((prev) => {
      if (prev.some((p) => p.id === rec.id)) {
        return prev
      }
      return [...prev, rec]
    })
    setExistingInquirySearch('')
    setExistingInquiryResults([])
    toast.success('Added to recipient list', {
      description: `${rec.fullName} · ${rec.whatsappNumber || rec.phone}`,
    })
  }

  const fetchSeekers = async () => {
    try {
      setLoading(true)
      const rows = promotionCodeHoldersOnly
        ? await fetchAllPromotionRecipients()
        : await fetchAllInquiryRecipients()
      setFetchedSeekers(rows)
    } catch (error) {
      console.error('Error fetching recipients:', error)
      setFetchedSeekers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setPrograms(Array.isArray(data) ? data : (Array.isArray(data?.programs) ? data.programs : []))
      } else {
        console.error('Failed to fetch programs:', response.status, response.statusText)
        setPrograms([])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      setPrograms([])
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/whatsapp/history')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setMessageHistory(Array.isArray(data?.messages) ? data.messages : [])
      } else {
        console.error('Failed to fetch message history:', response.status, response.statusText)
        setMessageHistory([])
      }
    } catch (error) {
      console.error('Error fetching message history:', error)
      setMessageHistory([])
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
      setMediaFile(null)
      setMediaPreview(null)

      const dataUrl = template.mediaBase64?.trim() || ''
      const path = template.mediaFilePath
      const isImageMime = template.mediaType?.startsWith('image/')
      const isDataImage = dataUrl.startsWith('data:image/')

      // DB-stored template image: build File synchronously so Send always gets a real attachment
      if (isDataImage) {
        try {
          const file = dataUrlToFile(
            dataUrl,
            template.mediaFilename || 'template-image',
            template.mediaType || undefined
          )
          setMediaFile(file)
          setMediaPreview(dataUrl)
        } catch (e) {
          console.error('Failed to decode template image:', e)
        }
        return
      }

      // Legacy: image served from URL path
      if (isImageMime && path) {
        const loadId = ++templateMediaLoadSeq.current
        ;(async () => {
          try {
            const res = await fetch(path)
            if (loadId !== templateMediaLoadSeq.current) return
            if (!res.ok) return
            const blob = await res.blob()
            const fileName = template.mediaFilename || 'template-image'
            const file = new File([blob], fileName, { type: template.mediaType || blob.type })
            if (loadId !== templateMediaLoadSeq.current) return
            setMediaFile(file)
            setMediaPreview(path)
          } catch (e) {
            console.error('Failed to load template image:', e)
          }
        })()
      }
    }
  }

  const resetTemplateDialog = () => {
    setEditingTemplateId(null)
    setEditingHadImage(false)
    setTemplateRemoveImage(false)
  }

  const handleOpenTemplateDialog = () => {
    resetTemplateDialog()
    setTemplateError(null)
    setTemplateName('')
    setTemplateContent(message || '')
    setTemplateImageFile(null)
    setTemplateImagePreview(null)
    setIsTemplateDialogOpen(true)
  }

  const handleOpenEditTemplate = (t: WhatsAppTemplate) => {
    resetTemplateDialog()
    setTemplateError(null)
    setEditingTemplateId(t.id)
    const had =
      Boolean(t.mediaBase64?.trim()) ||
      Boolean(t.mediaFilePath && t.mediaType?.startsWith('image/'))
    setEditingHadImage(had)
    setTemplateRemoveImage(false)
    setTemplateName(t.name)
    setTemplateContent(t.content)
    setTemplateImageFile(null)
    const preview =
      t.mediaBase64?.trim() ||
      (t.mediaFilePath && t.mediaType?.startsWith('image/') ? t.mediaFilePath : null)
    setTemplateImagePreview(preview)
    setIsTemplateGalleryOpen(false)
    setIsTemplateDialogOpen(true)
  }

  const handleDeleteTemplate = async (t: WhatsAppTemplate) => {
    if (!window.confirm(`Delete template “${t.name}”? This cannot be undone.`)) {
      return
    }
    try {
      const response = await fetch(`/api/whatsapp/templates/${t.id}`, { method: 'DELETE' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setSendStatus({
          type: 'error',
          message: result.error || 'Could not delete template.',
        })
        return
      }
      if (selectedTemplateId === t.id) {
        setSelectedTemplateId('none')
      }
      await fetchTemplates()
    } catch (e) {
      console.error(e)
      setSendStatus({ type: 'error', message: 'Could not delete template.' })
    }
  }

  const handleTemplateImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      setTemplateImageFile(null)
      setTemplateImagePreview(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setTemplateError('Please select an image file (JPEG, PNG, or GIF).')
      return
    }
    if (file.size > 16 * 1024 * 1024) {
      setTemplateError('Image size must be 16 MB or less.')
      return
    }
    setTemplateImageFile(file)
    setTemplateRemoveImage(false)
    const reader = new FileReader()
    reader.onload = (e) => setTemplateImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveTemplate = async () => {
    const name = templateName.trim()
    const content = templateContent
    if (!name) {
      setTemplateError('Please enter a template name.')
      return
    }
    if (!content.trim()) {
      setTemplateError('Please enter message content.')
      return
    }

    try {
      setTemplateSaving(true)
      setTemplateError(null)
      const formData = new FormData()
      formData.append('name', name)
      formData.append('content', content)
      if (templateImageFile) formData.append('media', templateImageFile)
      if (editingTemplateId && templateRemoveImage && !templateImageFile) {
        formData.append('clearImage', 'true')
      }

      const response = editingTemplateId
        ? await fetch(`/api/whatsapp/templates/${editingTemplateId}`, {
            method: 'PATCH',
            body: formData,
          })
        : await fetch('/api/whatsapp/templates', { method: 'POST', body: formData })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setTemplateError(result.error || 'Could not save template. Please try again.')
        return
      }

      // Refresh and auto-select
      await fetchTemplates()
      if (result?.template?.id) {
        setSelectedTemplateId(result.template.id)
        setMessage(result.template.content)
        const saved = result.template
        const savedDataUrl = saved.mediaBase64?.trim() || ''
        if (savedDataUrl.startsWith('data:image/')) {
          try {
            const file = dataUrlToFile(
              savedDataUrl,
              saved.mediaFilename || 'template-image',
              saved.mediaType || undefined
            )
            setMediaFile(file)
            setMediaPreview(savedDataUrl)
          } catch (e) {
            console.error('Failed to load saved template image:', e)
          }
        } else if (saved.mediaType?.startsWith('image/') && saved.mediaFilePath) {
          try {
            const res = await fetch(saved.mediaFilePath)
            if (res.ok) {
              const blob = await res.blob()
              const fileName = saved.mediaFilename || 'template-image'
              const file = new File([blob], fileName, { type: saved.mediaType || blob.type })
              setMediaFile(file)
              setMediaPreview(saved.mediaFilePath)
            }
          } catch (e) {
            console.error('Failed to load saved template image:', e)
          }
        }
      }
      resetTemplateDialog()
      setIsTemplateDialogOpen(false)
    } catch (error) {
      console.error('Error saving template:', error)
      setTemplateError('Connection error. Please try again.')
    } finally {
      setTemplateSaving(false)
    }
  }


  const handleSelectAll = () => {
    if (isAllFilteredSelected) {
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
          message: 'File size must be 16 MB or less.'
        })
        return
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setSendStatus({
          type: 'error',
          message: 'Supported formats: images, video, audio, or PDF/DOC. Please choose a supported file.'
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
        message: 'Please select at least one recipient.'
      })
      return
    }

    if (!message.trim() && !mediaFile) {
      setSendStatus({
        type: 'error',
        message: 'Please enter a message or attach a file.'
      })
      return
    }

    if (message.trim() && isMessageTooLong) {
      setSendStatus({
        type: 'error',
        message: `Message is too long. Keep it within ${MAX_WHATSAPP_MESSAGE_LENGTH} characters.`
      })
      return
    }

    try {
      setSending(true)
      setSendStatus(null)

      const selectedSeekersData = selectedRecipients.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        phone: r.phone,
        whatsappNumber: r.whatsappNumber || r.phone,
        whatsapp: r.whatsapp,
        marketingSource: r.marketingSource,
        recipientSource: r.source === 'promotion' ? ('promotion' as const) : ('inquiry' as const),
        promotionCodeId: r.source === 'promotion' ? r.id : undefined,
        promotionCode: r.promoCodeLabel || r.promotionCode?.code,
      }))

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
          message: `Sent to ${result.sentCount} recipient(s). ${result.failedCount} delivery failed.`
        })
        setSelectedSeekers(new Set())
        setMessage('')
        setMediaFile(null)
        setMediaPreview(null)
        // Refresh history after sending
        fetchHistory()
      } else {
        setSendStatus({
          type: 'error',
          message: result.error || 'Message delivery failed. Please try again.'
        })
      }
    } catch (_error) {
      setSendStatus({
        type: 'error',
        message: 'Connection error. Please check your network and try again.'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                WhatsApp Campaign
              </h1>
              <p className="text-sm text-muted-foreground">
                Compose once and send to selected recipients.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              Selected: {selectedSeekers.size}
            </Badge>
            <Button
              variant="outline"
              onClick={fetchHistory}
              className="flex items-center space-x-2"
            >
              <History className="h-4 w-4" />
              <span>Refresh history</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recipients */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">Recipients</h2>
                  <p className="text-xs text-muted-foreground">
                    {promotionCodeHoldersOnly
                      ? 'Promotion codes: each row is a promoter’s phone and code. Select who to message on WhatsApp.'
                      : 'Search, filter, and select inquiry recipients (WhatsApp-enabled inquiries only). Use “Add existing inquiry” to pull in another opted-in lead by name or phone.'}
                  </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      promotionCodeHoldersOnly
                        ? 'Filter by promoter name, phone, or code'
                        : 'Filter by name, phone, email, city, or promo code'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="min-w-[220px] flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProgramFilter(!showProgramFilter)}
                    disabled={promotionCodeHoldersOnly}
                    className="flex items-center space-x-1"
                    title={
                      promotionCodeHoldersOnly
                        ? 'Program filter applies to inquiries only. Turn off Promo to filter by program.'
                        : undefined
                    }
                  >
                    <Filter className="h-4 w-4" />
                    <span>Program</span>
                    {selectedPrograms.size > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {selectedPrograms.size}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={promotionCodeHoldersOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPromotionCodeHoldersOnly(!promotionCodeHoldersOnly)}
                    className="flex items-center space-x-1"
                    title="List all promotion codes: promoter phone and code (not inquiries). Use these numbers for WhatsApp."
                  >
                    <Gift className="h-4 w-4" />
                    <span>Promo</span>
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

                {!promotionCodeHoldersOnly && (
                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3">
                    <Label className="text-xs font-medium text-foreground">
                      Add existing inquiry
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Type at least 2 characters to search by name or phone. Only inquiries already marked for WhatsApp can be sent from this campaign.
                    </p>
                    <div className="relative">
                      <Input
                        placeholder="Search name or phone…"
                        value={existingInquirySearch}
                        onChange={(e) => setExistingInquirySearch(e.target.value)}
                        className="text-sm"
                        disabled={loading}
                      />
                      {existingInquirySearching && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          …
                        </span>
                      )}
                      {existingInquiryResults.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                          {existingInquiryResults.map((row) => {
                            const phone = (row.phone || row.whatsappNumber || '').trim()
                            return (
                              <button
                                key={row.id}
                                type="button"
                                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/80"
                                onClick={() => handleAddExistingInquiry(row)}
                              >
                                <span className="font-medium">
                                  {row.fullName?.trim() || 'Inquiry'}
                                </span>
                                <span className="text-xs text-muted-foreground">{phone || 'No phone'}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Program Filter Dropdown */}
                {showProgramFilter && (
                  <div className="border border-border/60 rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-foreground">Filter by program</h3>
                      <div className="flex items-center space-x-2">
                        {selectedPrograms.size > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearProgramFilters}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowProgramFilter(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {programs.map((program) => (
                        <div key={program.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`program-${program.id}`}
                            checked={selectedPrograms.has(program.id)}
                            onCheckedChange={() => handleSelectProgram(program.id)}
                          />
                          <Label 
                            htmlFor={`program-${program.id}`} 
                            className="text-sm text-muted-foreground cursor-pointer flex-1"
                          >
                            {program.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary" className="font-normal">Total: {seekers.length}</Badge>
                  <Badge variant="secondary" className="font-normal">Shown: {filteredSeekers.length}</Badge>
                  <Badge variant="secondary" className="font-normal">Selected: {selectedRecipients.length}</Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllFilteredSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select all shown
                  </Label>
                </div>

                <ScrollArea className="h-[520px]">
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden />
                        <span className="text-sm text-muted-foreground">Loading recipients…</span>
                      </div>
                    ) : filteredSeekers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm px-2">
                        {promotionCodeHoldersOnly
                          ? 'No promotion codes found, or none match your search. Add codes under Promotion codes in the sidebar.'
                          : 'No recipients match your filters.'}
                      </div>
                    ) : (
                      filteredSeekers.map((seeker) => (
                        <div
                          key={seeker.id}
                          className="flex items-center space-x-3 p-3 border border-border/60 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <Checkbox
                            id={`seeker-${seeker.id}`}
                            checked={selectedSeekers.has(seeker.id)}
                            onCheckedChange={() => handleSelectSeeker(seeker.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                  {(seeker.fullName || '?')
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <h3 className="text-sm font-medium text-foreground truncate">
                                  {seeker.fullName}
                                </h3>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(seeker.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="font-medium text-foreground/90">
                                  {seeker.whatsappNumber || seeker.phone}
                                </span>
                              </div>
                              {(seeker.promoCodeLabel || seeker.promotionCode?.code) && (
                                <Badge variant="outline" className="text-[10px] font-normal h-5 px-1.5">
                                  Code: {seeker.promoCodeLabel ?? seeker.promotionCode?.code}
                                </Badge>
                              )}
                              {seeker.city && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{seeker.city}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Message Composition */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">Message</h2>
                  <p className="text-xs text-muted-foreground">
                    Choose a template, edit the text, then send.
                  </p>
                </div>

                {/* Templates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Message template</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenTemplateDialog}
                      >
                        Create template
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
                          ? 'Loading templates…'
                          : selectedTemplateId === 'none'
                            ? 'Choose a template'
                            : (templates.find((t) => t.id === selectedTemplateId)?.name || 'Choose a template')}
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
                    Message content
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message. You can use a template or type below."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2 min-h-[120px]"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Variables: {"{{StudentName}}"}, {"{{ProgramName}}"}, {"{{InquiryID}}"}, {"{{CounselorName}}"}
                    </span>
                    <span className={isMessageTooLong ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                      {messageLength}/{MAX_WHATSAPP_MESSAGE_LENGTH}
                    </span>
                  </div>
                </div>
                
                {/* Media Upload Section */}
                <div>
                  <Label className="text-sm font-medium">Attachment (optional)</Label>
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
                        className="flex items-center space-x-2 px-3 py-2 border border-border/60 rounded-md cursor-pointer hover:bg-muted/30"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Attach file</span>
                      </label>
                    </div>

                    {/* Media Preview */}
                    {mediaFile && (
                      <div className="border border-border/60 rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(mediaFile)}
                            <div>
                              <p className="text-sm font-medium">{mediaFile.name}</p>
                              <p className="text-xs text-muted-foreground">
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
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    Ready to send: <span className="font-medium text-foreground">{selectedSeekers.size}</span> recipient{selectedSeekers.size === 1 ? '' : 's'}
                  </p>
                  <Button
                    onClick={handleSendMessages}
                    disabled={sending || selectedSeekers.size === 0 || isMessageTooLong}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {sending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending…</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Send WhatsApp Message</span>
                      </div>
                    )}
                  </Button>
                </div>

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

          {/* Preview + Recent Campaigns */}
          <div className="lg:col-span-3 order-3">
            <div className="space-y-4 lg:sticky lg:top-6">
              <Card className="p-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground tracking-wide">Preview</h3>
                  <div className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      {primaryRecipient?.fullName || 'Recipient'}
                    </div>
                    <div className="rounded-lg bg-muted/20 p-3 min-h-[160px] max-h-[260px] overflow-y-auto space-y-2">
                      {mediaPreview && mediaFile?.type.startsWith('image/') && (
                        <div className="max-w-[90%] rounded-lg overflow-hidden border border-border/60 bg-card">
                          <img
                            src={mediaPreview}
                            alt="Template or attachment preview"
                            className="w-full max-h-36 object-cover"
                          />
                        </div>
                      )}
                      <div className="max-w-[90%] rounded-lg bg-card border border-border/60 p-3 text-sm whitespace-pre-wrap">
                        {previewMessage || 'Your message preview will appear here...'}
                      </div>
                      {replyPreviewMessage && (
                        <div className="ml-auto max-w-[90%] rounded-lg bg-green-500/15 border border-green-500/20 p-3 text-sm whitespace-pre-wrap">
                          {replyPreviewMessage}
                        </div>
                      )}
                    </div>
                    {mediaFile && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {mediaFile.type.startsWith('image/')
                          ? `Image attached — will send with your message (${mediaFile.name}).`
                          : `Attachment: ${mediaFile.name}`}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground tracking-wide">Recent Campaigns</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchHistory}
                      disabled={historyLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {historyLoading ? (
                      <div className="text-sm text-muted-foreground py-4">Loading history...</div>
                    ) : messageHistory.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4">No campaign history yet.</div>
                    ) : (
                      messageHistory.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-lg border border-border/60 p-3">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {item.message || 'Untitled message'}
                          </p>
                          <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                            <span>
                              {item.sentCount}/{item.recipientCount} delivered
                              {item.failedCount > 0 ? `, ${item.failedCount} failed` : ''}
                            </span>
                            <span>{new Date(item.sentAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={(open) => {
          setIsTemplateDialogOpen(open)
          if (!open) resetTemplateDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplateId ? 'Edit message template' : 'Create message template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplateId
                ? 'Update the name, text, or image. Save to apply changes.'
                : 'Reusable messages save time. Create once, then select from the template list when composing.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Welcome message"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Message content</Label>
              <Textarea
                id="template-content"
                placeholder="Enter the message text for this template."
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-image">Image (optional)</Label>
              <Input
                id="template-image"
                type="file"
                accept="image/*"
                onChange={handleTemplateImageChange}
              />
              {templateImagePreview && !templateRemoveImage && (
                <img
                  src={templateImagePreview}
                  alt="Template preview"
                  className="max-w-full h-32 object-cover rounded border"
                />
              )}
              {editingTemplateId && editingHadImage && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="template-remove-image"
                    checked={templateRemoveImage}
                    onCheckedChange={(checked) => {
                      setTemplateRemoveImage(checked === true)
                      if (checked === true) {
                        setTemplateImageFile(null)
                        setTemplateImagePreview(null)
                      } else if (editingTemplateId) {
                        const t = templates.find((x) => x.id === editingTemplateId)
                        if (t) {
                          const preview =
                            t.mediaBase64?.trim() ||
                            (t.mediaFilePath && t.mediaType?.startsWith('image/')
                              ? t.mediaFilePath
                              : null)
                          setTemplateImagePreview(preview)
                        }
                      }
                    }}
                  />
                  <Label htmlFor="template-remove-image" className="text-sm font-normal cursor-pointer">
                    Remove image from template
                  </Label>
                </div>
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
              {templateSaving ? 'Saving…' : editingTemplateId ? 'Update template' : 'Save template'}
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
              <div className="col-span-full text-sm text-muted-foreground">Loading templates...</div>
            ) : (
              <>
                <button
                  key="none"
                  type="button"
                  onClick={() => {
                    handleTemplateSelect('none')
                    setIsTemplateGalleryOpen(false)
                  }}
                  className="text-left border border-border/60 rounded-lg overflow-hidden hover:bg-muted/30 transition-colors"
                >
                  <div className="h-32 bg-muted/30 flex items-center justify-center overflow-hidden">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8" />
                      <span className="text-xs mt-1">Start from scratch</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm text-foreground truncate">None</div>
                    <div className="text-xs text-muted-foreground mt-1">Use empty message</div>
                  </div>
                </button>

                {templates.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground">No templates yet. Create one from the &quot;Create template&quot; button.</div>
                ) : (
                  templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col border border-border/60 rounded-lg overflow-hidden bg-card"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleTemplateSelect(t.id)
                          setIsTemplateGalleryOpen(false)
                        }}
                        className="text-left flex-1 hover:bg-muted/30 transition-colors"
                      >
                        <div className="h-32 bg-muted/30 flex items-center justify-center overflow-hidden">
                          {(t.mediaBase64 || t.mediaFilePath) &&
                          (t.mediaType?.startsWith('image/') || t.mediaBase64?.startsWith('data:image/')) ? (
                            <img
                              src={t.mediaBase64 || t.mediaFilePath || ''}
                              alt={t.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Image className="h-8 w-8" />
                              <span className="text-xs mt-1">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-sm text-foreground truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">
                            {t.content}
                          </div>
                        </div>
                      </button>
                      <div className="flex gap-1 p-2 border-t border-border/60 bg-muted/20">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => handleOpenEditTemplate(t)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTemplate(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
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
