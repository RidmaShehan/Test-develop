'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Upload,
  X,
  Plus,
  ImageIcon,
  Zap,
  Loader2,
  FileText,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  Link2,
  Video,
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { cn } from '@/lib/utils'

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?|$)/i
const VIDEO_DOMAINS = /youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com/i
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i
function isVideoUrl(url: string): boolean {
  try {
    const u = url.trim()
    return VIDEO_EXTENSIONS.test(u) || VIDEO_DOMAINS.test(u)
  } catch {
    return false
  }
}
function isValidMediaUrl(url: string): boolean {
  try {
    new URL(url.trim())
    return true
  } catch {
    return false
  }
}

interface Program {
  id: string
  name: string
  campus: string
}

interface Campaign {
  id: string
  name: string
  type: string
}

interface User {
  id: string
  name: string
  email: string
}

interface NewPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated?: () => void
}

export function NewPostDialog({ open, onOpenChange, onPostCreated }: NewPostDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [isCompressingImage, setIsCompressingImage] = useState(false)
  const [isEncodingImage, setIsEncodingImage] = useState(false)
  const [isDecodingImage, setIsDecodingImage] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [mediaLinkInput, setMediaLinkInput] = useState('')
  const [mediaLinkError, setMediaLinkError] = useState<string | null>(null)
  const [mediaPreviewLoading, setMediaPreviewLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    caption: '',
    imageUrl: '',
    videoUrl: '',
    mediaType: '' as '' | 'image' | 'video',
    budget: '',
    startDate: '',
    endDate: '',
    programId: '',
    campaignId: '',
    approvers: [] as string[],
  })

  useEffect(() => {
    if (open) {
      fetchPrograms()
      fetchCampaigns()
      fetchUsers()
    }
  }, [open])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        setPrograms(await response.json())
      } else if (response.status === 401) {
        setUploadError('Session expired. Please sign in again.')
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else if (response.status === 401) {
        setUploadError('Session expired. Please sign in again.')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        setUsers(await response.json())
      } else if (response.status === 401) {
        setUploadError('Session expired. Please sign in again.')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const processAndUploadImage = useCallback(async (file: File) => {
    setUploadError(null)
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, GIF, or WebP).')
      toast.error('Please select an image file')
      return
    }

    let processedFile = file
    const maxSize = 5 * 1024 * 1024
    const safeForRequest = 1024 * 1024 // 1 MB — keep JSON payload practical

    if (file.size > maxSize) {
      setIsCompressingImage(true)
      toast.info('Large image detected — compressing...')
      try {
        processedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        })
        const ratio = (((file.size - processedFile.size) / file.size) * 100).toFixed(1)
        toast.success(`Image compressed — size reduced by ${ratio}%`)
      } catch {
        setUploadError('Image compression failed. Try a smaller image.')
        toast.error('Image compression failed')
        setIsCompressingImage(false)
        return
      } finally {
        setIsCompressingImage(false)
      }
    }
    if (processedFile.size > safeForRequest) {
      setIsCompressingImage(true)
      try {
        processedFile = await imageCompression(processedFile, {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.75,
        })
      } catch {
        setUploadError('Image too large. Use a smaller image (under 1 MB) or paste an image link instead.')
        toast.error('Image too large to upload')
        return
      } finally {
        setIsCompressingImage(false)
      }
    }

    try {
      setIsEncodingImage(true)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Failed to encode image as base64'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to encode image as base64'))
        reader.readAsDataURL(processedFile)
      })
      setIsEncodingImage(false)

      setIsDecodingImage(true)
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to decode image preview'))
        img.src = dataUrl
      })
      setIsDecodingImage(false)

      setImagePreview(dataUrl)
      setFormData(prev => ({ ...prev, imageUrl: dataUrl, videoUrl: '', mediaType: 'image' }))
      setUploadError(null)
      toast.success('Image converted to base64 successfully')
    } catch (error) {
      console.error('Error processing image:', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Image processing failed. If the image is large, try a smaller file or use an image link.'
      setUploadError(message)
      toast.error('Failed to process image')
      setImagePreview(null)
      setFormData(prev => ({ ...prev, imageUrl: '', videoUrl: '', mediaType: '' }))
    } finally {
      setIsEncodingImage(false)
      setIsDecodingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processAndUploadImage(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processAndUploadImage(file)
    },
    [processAndUploadImage]
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setFormData(prev => ({ ...prev, imageUrl: '', videoUrl: '', mediaType: '' }))
    setImagePreview(null)
    setUploadError(null)
    setMediaLinkInput('')
    setMediaLinkError(null)
    setMediaPreviewLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMediaLinkSubmit = () => {
    setMediaLinkError(null)
    setUploadError(null)
    const url = mediaLinkInput.trim()
    if (!url) {
      setMediaLinkError('Please enter a valid URL.')
      return
    }
    if (!isValidMediaUrl(url)) {
      setMediaLinkError('Please enter a valid URL (e.g. https://… or Google Drive share link).')
      return
    }
    const isVideo = isVideoUrl(url)
    setMediaPreviewLoading(true)
    if (isVideo) {
      setFormData(prev => ({ ...prev, videoUrl: url, imageUrl: '', mediaType: 'video' }))
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      toast.success('Video URL added. Preview loads below (only URL is saved).')
      setMediaLinkInput('')
      setTimeout(() => setMediaPreviewLoading(false), 800)
    } else {
      setFormData(prev => ({ ...prev, imageUrl: url, videoUrl: '', mediaType: 'image' }))
      setImagePreview(url)
      toast.success('Image URL added. Preview loads below (only URL is saved).')
      setMediaLinkInput('')
    }
  }

  const handleMediaPreviewLoaded = () => setMediaPreviewLoading(false)
  const handleMediaPreviewError = () => {
    setMediaPreviewLoading(false)
    setUploadError('Could not load preview from URL. Link may be private or invalid.')
  }

  const handleApproverChange = (index: number, userId: string) => {
    setFormData(prev => {
      const newApprovers = [...prev.approvers]
      newApprovers[index] = userId
      return { ...prev, approvers: newApprovers }
    })
  }

  const handleRemoveApprover = (index: number) => {
    setFormData(prev => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setFormData({
      caption: '',
      imageUrl: '',
      videoUrl: '',
      mediaType: '',
      budget: '',
      startDate: '',
      endDate: '',
      programId: '',
      campaignId: '',
      approvers: [],
    })
    setImagePreview(null)
    setUploadError(null)
    setMediaLinkInput('')
    setMediaLinkError(null)
    setMediaPreviewLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.caption.trim()) {
      toast.error('Please enter a caption')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select campaign duration')
      return
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date')
      return
    }
    if (formData.approvers.length === 0) {
      toast.error('Please add at least one approver')
      return
    }
    if (formData.approvers.some(a => !a)) {
      toast.error('Please select all approvers before submitting')
      return
    }
    if (new Set(formData.approvers).size !== formData.approvers.length) {
      toast.error('Duplicate approvers are not allowed')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: formData.caption,
          imageUrl: formData.imageUrl || null,
          videoUrl: formData.videoUrl || null,
          mediaType: formData.mediaType || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          programId: formData.programId || null,
          campaignId: formData.campaignId || null,
          approvers: formData.approvers,
        }),
      })

      if (response.ok) {
        toast.success('Post created and submitted for approval')
        onPostCreated?.()
        onOpenChange(false)
        resetForm()
      } else {
        const error = await response.json()
        if (response.status === 401) {
          toast.error('Session expired. Please sign in again.')
        } else {
          toast.error(error.error || 'Failed to create post')
        }
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  const isImageBusy = isCompressingImage || isEncodingImage || isDecodingImage

  const hasMedia = !!(formData.imageUrl || formData.videoUrl)
  const showVideoPreview = formData.mediaType === 'video' && formData.videoUrl
  const showImagePreview = formData.mediaType === 'image' && (imagePreview || formData.imageUrl)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-full max-w-[calc(100%-2rem)] sm:max-w-2xl lg:max-w-4xl',
          'max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden z-[100]'
        )}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold tracking-tight pr-8">
            Create New Post for Approval
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a social media post and submit it through your approval chain
          </p>
        </DialogHeader>

        {/* ── Body ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-w-0">

              {/* LEFT: Caption + Image */}
              <div className="space-y-5 bg-background min-w-0">

                {/* Caption */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label htmlFor="caption" className="font-medium leading-none">
                      Caption <span className="text-destructive ml-0.5">*</span>
                    </Label>
                  </div>
                  <Textarea
                    id="caption"
                    value={formData.caption}
                    onChange={e => setFormData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Write your post caption here…"
                    rows={5}
                    required
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right tabular-nums">
                    {formData.caption.length} characters
                  </p>
                </div>

                {/* Image / Video — Upload or link */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label className="font-medium leading-none">Post Image or Video</Label>
                    <Badge variant="secondary" className="text-xs font-normal ml-1">
                      Optional
                    </Badge>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="sr-only"
                    id="image-upload"
                    tabIndex={-1}
                  />

                  {showVideoPreview ? (
                    /* Video preview — auto-fetched from URL (preview only; only URL is saved) */
                    <div className="relative rounded-xl overflow-hidden border bg-muted">
                      <div className="w-full aspect-video bg-black flex items-center justify-center max-h-52">
                        {mediaPreviewLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 z-10">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                            <p className="text-white text-sm">Loading video preview…</p>
                          </div>
                        )}
                        {formData.videoUrl && (() => {
                          const url = formData.videoUrl
                          const ytId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)?.[1]
                          const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
                          if (ytId) {
                            return (
                              <iframe
                                title="Video preview"
                                className="w-full h-full min-h-0"
                                src={`https://www.youtube.com/embed/${ytId}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )
                          }
                          if (vimeoId) {
                            return (
                              <iframe
                                title="Video preview"
                                className="w-full h-full min-h-0"
                                src={`https://player.vimeo.com/video/${vimeoId}`}
                                allowFullScreen
                              />
                            )
                          }
                          return (
                            <video
                              src={url}
                              controls
                              className="w-full h-full object-contain"
                              preload="metadata"
                              onLoadedData={handleMediaPreviewLoaded}
                              onError={handleMediaPreviewError}
                            />
                          )
                        })()}
                      </div>
                      {!isImageBusy && (
                        <>
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-emerald-500/90 text-white border-0 gap-1 text-xs">
                              <Video className="w-3 h-3" />
                              Video link
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            aria-label="Remove video"
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : showImagePreview ? (
                    /* Image preview — auto-fetched from URL (preview only; only URL is saved) */
                    <div className="relative rounded-xl overflow-hidden border bg-muted">
                      {mediaPreviewLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted z-10">
                          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                          <p className="text-sm text-muted-foreground">Loading image preview…</p>
                        </div>
                      )}
                      <img
                        src={imagePreview || formData.imageUrl || ''}
                        alt="Post preview"
                        className="w-full h-52 object-cover"
                        onLoad={handleMediaPreviewLoaded}
                        onError={handleMediaPreviewError}
                      />

                      {isImageBusy && (
                        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                          {isCompressingImage ? (
                            <>
                              <Zap className="w-7 h-7 text-yellow-400 animate-pulse" />
                              <p className="text-white text-sm font-medium">Compressing image…</p>
                            </>
                          ) : isEncodingImage ? (
                            <>
                              <Loader2 className="w-7 h-7 text-white animate-spin" />
                              <p className="text-white text-sm font-medium">Encoding base64…</p>
                            </>
                          ) : isDecodingImage ? (
                            <>
                              <Loader2 className="w-7 h-7 text-white animate-spin" />
                              <p className="text-white text-sm font-medium">Decoding preview…</p>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-7 h-7 text-white animate-spin" />
                              <p className="text-white text-sm font-medium">Processing image…</p>
                            </>
                          )}
                        </div>
                      )}

                      {!isImageBusy && formData.imageUrl && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-emerald-500/90 text-white border-0 gap-1 text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            {formData.imageUrl.startsWith('http') ? 'Image link' : formData.imageUrl.startsWith('data:') ? 'Base64 image' : 'Uploaded'}
                          </Badge>
                        </div>
                      )}

                      {!isImageBusy && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          aria-label="Remove image"
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {!isImageBusy && !formData.imageUrl?.startsWith('http') && (
                        <label
                          htmlFor="image-upload"
                          className="absolute inset-x-0 bottom-0 flex justify-center pb-3 pt-8 opacity-0 hover:opacity-100 transition-opacity cursor-pointer bg-gradient-to-t from-black/50 to-transparent"
                        >
                          <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
                            Click to replace
                          </span>
                        </label>
                      )}
                    </div>
                  ) : (
                    /* Dropzone state */
                    <>
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                          'relative rounded-xl border-2 border-dashed h-52 flex flex-col items-center justify-center',
                          'transition-all duration-150',
                          isDragOver
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border hover:border-primary/50 hover:bg-muted/40'
                        )}
                      >
                        <label
                          htmlFor="image-upload"
                          className="absolute inset-0 cursor-pointer rounded-xl"
                          aria-label="Upload image"
                        />
                        <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                              isDragOver ? 'bg-primary/10' : 'bg-muted'
                            )}
                          >
                            <Upload
                              className={cn(
                                'w-5 h-5 transition-colors',
                                isDragOver ? 'text-primary' : 'text-muted-foreground'
                              )}
                            />
                          </div>
                          <div className="text-center space-y-0.5">
                            <p className="text-sm font-medium">
                              {isDragOver ? 'Drop image here' : 'Upload image or add link below'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, GIF · Auto-compressed if &gt;5 MB · stored as base64
                            </p>
                          </div>
                        </div>
                      </div>
                      {uploadError && (
                        <p className="text-sm text-destructive mt-1.5" role="alert">
                          {uploadError}
                        </p>
                      )}
                      {/* Add image or video URL — one field for both; preview loads automatically */}
                      <div className="space-y-1.5 pt-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Or add by URL (image or video)
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                              type="url"
                              placeholder="Paste image or video URL (e.g. Google Drive, YouTube, direct link)"
                              value={mediaLinkInput}
                              onChange={e => {
                                setMediaLinkInput(e.target.value)
                                setMediaLinkError(null)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleMediaLinkSubmit()
                                }
                              }}
                              className="pl-8"
                            />
                          </div>
                          <Button type="button" variant="secondary" onClick={handleMediaLinkSubmit}>
                            Add URL
                          </Button>
                        </div>
                        {mediaLinkError && (
                          <p className="text-sm text-destructive" role="alert">
                            {mediaLinkError}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          One URL for either image or video. Preview loads automatically above; only the URL is saved (file is not uploaded).
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT: Settings + Approval Chain */}
              <div className="space-y-5 bg-background relative z-10 min-w-0">
                {/* Program & Campaign */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="program" className="text-sm font-medium">
                      Program
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.programId}
                      onValueChange={value => setFormData(prev => ({ ...prev, programId: value }))}
                    >
                      <SelectTrigger id="program" className="w-full">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
                        {programs.map(program => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} — {program.campus}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="campaign" className="text-sm font-medium">
                      Campaign
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.campaignId}
                      onValueChange={value => setFormData(prev => ({ ...prev, campaignId: value }))}
                    >
                      <SelectTrigger id="campaign" className="w-full">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
                        {campaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget & Dates */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label className="font-medium leading-none">Campaign Details</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="budget" className="text-xs text-muted-foreground">
                        Budget
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="budget"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.budget}
                          onChange={e => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                        Start Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                        End Date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Approval Chain */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Label className="font-medium leading-none">
                        Approval Chain <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      {formData.approvers.length > 0 && (
                        <Badge variant="secondary" className="text-xs font-normal ml-1 shrink-0">
                          {formData.approvers.length} / 5
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData(prev => ({ ...prev, approvers: [...prev.approvers, ''] }))
                      }
                      disabled={formData.approvers.length >= 5}
                      className="h-8 text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Approver
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Approvers are notified in order — each must approve before the next can review.
                  </p>

                  <div className="space-y-2 mt-1">
                    {formData.approvers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-7 border-2 border-dashed rounded-xl text-center">
                        <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No approvers yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Click &ldquo;Add Approver&rdquo; to build your chain
                        </p>
                      </div>
                    ) : (
                      formData.approvers.map((approverId, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {/* Numbered step circle */}
                          <div
                            className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                              approverId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground border-2 border-dashed'
                            )}
                          >
                            {index + 1}
                          </div>

                          <Select
                            value={approverId}
                            onValueChange={value => handleApproverChange(index, value)}
                          >
                            <SelectTrigger
                              className={cn('flex-1 h-9', !approverId && 'border-dashed')}
                            >
                              <SelectValue placeholder={`Select approver ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent className="z-[110]">
                              {users
                                .filter(
                                  u =>
                                    !formData.approvers.includes(u.id) || u.id === approverId
                                )
                                .map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    <div className="flex flex-col py-0.5">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {user.email}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          <button
                            type="button"
                            onClick={() => handleRemoveApprover(index)}
                            aria-label={`Remove approver ${index + 1}`}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20">
            <p className="hidden sm:block text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Required fields
            </p>
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || isImageBusy}
                className="min-w-[190px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : isImageBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing image…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
