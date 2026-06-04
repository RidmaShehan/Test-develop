'use client'

import { useCallback, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DocUploaderProps {
  seekerId: string
  documentTypeId: string
  category: string
  acceptedFormats?: string
  maxSizeMb?: number
  documentName?: string
  onSuccess?: () => void
}

export function DocUploader({
  seekerId,
  documentTypeId,
  category,
  acceptedFormats = 'pdf,jpg,jpeg,png',
  maxSizeMb = 5,
  documentName = 'document',
  onSuccess,
}: DocUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formats = acceptedFormats.split(',').map((f) => f.trim().toLowerCase())
  const accept = formats.map((f) => (f === 'pdf' ? 'application/pdf' : `image/${f}`)).join(',')

  function validateFile(file: File): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!formats.includes(ext)) return `File type .${ext} is not accepted. Allowed: ${acceptedFormats}`
    if (file.size > maxSizeMb * 1024 * 1024) return `File is too large. Maximum size is ${maxSizeMb}MB.`
    return null
  }

  function handleFile(file: File) {
    const error = validateFile(file)
    if (error) { setFileError(error); setSelectedFile(null); return }
    setFileError(null)
    setSelectedFile(file)
    setUploadedName(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function handleUpload() {
    if (!selectedFile) return
    setIsUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('seekerId', seekerId)
    formData.append('documentTypeId', documentTypeId)
    formData.append('category', category)

    const interval = setInterval(() => setProgress((p) => Math.min(p + 10, 85)), 250)

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      const data = await res.json()
      clearInterval(interval)
      if (data.success) {
        setProgress(100)
        setUploadedName(selectedFile.name)
        setSelectedFile(null)
        toast.success('Document uploaded successfully')
        onSuccess?.()
      } else {
        setProgress(0)
        toast.error(data.error || 'Upload failed')
      }
    } catch {
      clearInterval(interval)
      setProgress(0)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const isImage = selectedFile
    ? ['jpg', 'jpeg', 'png', 'webp'].includes(selectedFile.name.split('.').pop()?.toLowerCase() ?? '')
    : false

  return (
    <div className="space-y-3">
      {!uploadedName && (
        <div
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3',
            'min-h-[140px] rounded-xl border-2 border-dashed cursor-pointer',
            'transition-all duration-200 select-none',
            isDragging
              ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30 scale-[1.01]'
              : selectedFile
              ? 'border-slate-300 bg-slate-50 dark:bg-slate-900'
              : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />

          {selectedFile ? (
            <div className="flex items-center gap-3 px-4">
              {isImage
                ? <ImageIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                : <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />}
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                className="ml-auto p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drop {documentName} here</p>
                <p className="text-xs text-slate-400 mt-0.5">or click to browse</p>
              </div>
            </>
          )}
        </div>
      )}

      {!uploadedName && (
        <p className="text-xs text-slate-400 text-center">
          Accepted: <span className="font-medium">{acceptedFormats.toUpperCase()}</span>
          {' · '}Max size: <span className="font-medium">{maxSizeMb}MB</span>
        </p>
      )}

      {fileError && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {fileError}
        </div>
      )}

      {isUploading && (
        <div className="space-y-1.5">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-slate-400 text-center">Uploading... {progress}%</p>
        </div>
      )}

      {uploadedName && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 truncate">{uploadedName}</p>
            <p className="text-xs text-green-600 mt-0.5">Uploaded — pending verification</p>
          </div>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs shrink-0">Pending</Badge>
        </div>
      )}

      {selectedFile && !isUploading && (
        <Button onClick={handleUpload} className="w-full bg-sky-600 hover:bg-sky-700 text-white h-10">
          <Upload className="w-4 h-4 mr-2" />
          Upload {documentName}
        </Button>
      )}
    </div>
  )
}
