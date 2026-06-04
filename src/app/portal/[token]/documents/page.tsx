'use client'

import { useState, useEffect, useRef } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, CheckCircle2, XCircle, Clock, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ChecklistItem {
  documentTypeId: string
  documentType: { name: string; category: string }
  required: boolean
  document: { id: string; status: string; rejectionReason?: string; originalName: string } | null
  request: { id: string; dueDate?: string; message?: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  VERIFIED: { label: 'Verified', icon: CheckCircle2, className: 'text-green-600 bg-green-50 border-green-200' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'text-red-600 bg-red-50 border-red-200' },
  PENDING: { label: 'Pending Review', icon: Clock, className: 'text-amber-600 bg-amber-50 border-amber-200' },
}

function UploadZone({ documentTypeId, token, onUploaded }: { documentTypeId: string; token: string; onUploaded: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setIsUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('documentTypeId', documentTypeId)
    try {
      const res = await fetch(`/api/portal/${token}/documents`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) { toast.success('Document uploaded'); onUploaded() }
      else toast.error(data.error || 'Upload failed')
    } catch { toast.error('Upload failed') }
    finally { setIsUploading(false) }
  }

  return (
    <div
      className={cn('border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors', isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300')}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
      {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /> : (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Upload className="w-4 h-4" />
          <span>Click or drag to upload</span>
        </div>
      )}
    </div>
  )
}

export default function PortalDocumentsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/portal/${token}/checklist`)
      const data = await res.json()
      if (data.success) setChecklist(data.data.checklist)
      else setError(data.error || 'Failed to load')
    } catch { setError('Failed to load documents') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { load() }, [token])

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/portal/${token}`} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Documents</h1>
          <p className="text-sm text-slate-500">Upload your required documents below</p>
        </div>
      </div>

      {checklist.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <FileText className="w-12 h-12 mb-3 opacity-30" />
          <p>No document requirements found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checklist.map((item) => {
            const status = item.document?.status
            const cfg = status ? STATUS_CONFIG[status] : null

            return (
              <div key={item.documentTypeId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{item.documentType.name}</p>
                      {item.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{item.documentType.category?.toLowerCase()?.replace('_', ' ')}</p>
                  </div>
                  {cfg && (
                    <Badge className={cn('border flex-shrink-0 gap-1', cfg.className)}>
                      <cfg.icon className="w-3 h-3" />{cfg.label}
                    </Badge>
                  )}
                </div>

                {item.document?.status === 'REJECTED' && item.document?.rejectionReason && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                    <p className="font-medium">Rejection reason:</p>
                    <p>{item.document.rejectionReason}</p>
                  </div>
                )}

                {item.request?.message && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                    {item.request.message}
                  </div>
                )}

                {(!item.document || item.document.status === 'REJECTED') && (
                  <UploadZone documentTypeId={item.documentTypeId} token={token} onUploaded={load} />
                )}

                {item.document?.status === 'PENDING' && (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />Uploaded: {item.document.originalName} — awaiting review
                  </div>
                )}

                {item.document?.status === 'VERIFIED' && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />Approved: {item.document.originalName}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
