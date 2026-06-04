'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { DocUploader } from './DocUploader'
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Download, RefreshCw,
  Send, ChevronDown, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  VERIFIED: { label: 'Verified', cls: 'bg-green-100 text-green-800 border-green-200' },
  PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-200' },
  REQUESTED: { label: 'Requested', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  MISSING: { label: 'Missing', cls: 'bg-slate-100 text-slate-600 border-slate-200 border-dashed' },
  EXPIRED: { label: 'Expired', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
}

const CATEGORY_LABELS: Record<string, string> = {
  IDENTITY: 'Identity Documents',
  ACADEMIC: 'Academic Records',
  FINANCIAL: 'Financial Documents',
  PROGRAM: 'Program Documents',
  OTHER: 'Other Documents',
}

interface DocChecklistProps {
  seekerId: string
  programId?: string
  studentName: string
  studentEmail?: string
}

export function DocChecklist({ seekerId, programId, studentName, studentEmail }: DocChecklistProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['IDENTITY', 'ACADEMIC']))

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; docId: string; docName: string }>({ open: false, docId: '', docName: '' })
  const [requestDialog, setRequestDialog] = useState<{ open: boolean; typeId: string; typeName: string; category: string }>({ open: false, typeId: '', typeName: '', category: 'OTHER' })
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; item: any }>({ open: false, item: null })
  const [rejectReason, setRejectReason] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requestDueDate, setRequestDueDate] = useState('')
  const [isActioning, setIsActioning] = useState(false)

  const fetchChecklist = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ seekerId })
      if (programId) params.set('programId', programId)
      const res = await fetch(`/api/documents/checklist?${params}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch { /* noop */ }
    finally { setIsLoading(false) }
  }, [seekerId, programId])

  useEffect(() => { fetchChecklist() }, [fetchChecklist])

  async function handleDownload(docId: string) {
    const res = await fetch(`/api/documents/${docId}/download`)
    const json = await res.json()
    if (json.data?.url) window.open(json.data.url, '_blank')
  }

  async function handleVerify(docId: string) {
    setIsActioning(true)
    try {
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY' }),
      })
      const json = await res.json()
      if (json.success) { toast.success('Document verified'); fetchChecklist() }
      else toast.error(json.error || 'Failed')
    } catch { toast.error('Action failed') }
    finally { setIsActioning(false) }
  }

  async function handleReject() {
    if (rejectReason.length < 10) { toast.error('Please provide a detailed reason'); return }
    setIsActioning(true)
    try {
      const res = await fetch(`/api/documents/${rejectDialog.docId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: rejectReason }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Document rejected')
        setRejectDialog({ open: false, docId: '', docName: '' })
        setRejectReason('')
        fetchChecklist()
      } else toast.error(json.error || 'Failed')
    } catch { toast.error('Action failed') }
    finally { setIsActioning(false) }
  }

  async function handleRequest() {
    setIsActioning(true)
    try {
      const res = await fetch('/api/documents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seekerId, documentTypeId: requestDialog.typeId, message: requestMessage || undefined, dueDate: requestDueDate || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Request sent')
        setRequestDialog({ open: false, typeId: '', typeName: '', category: 'OTHER' })
        setRequestMessage('')
        setRequestDueDate('')
        fetchChecklist()
      } else toast.error(json.error || 'Failed')
    } catch { toast.error('Request failed') }
    finally { setIsActioning(false) }
  }

  if (isLoading) return <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
  if (!data) return null

  const { checklist, extraDocuments, summary } = data
  const grouped: Record<string, any[]> = {}
  for (const item of checklist) {
    const cat = item.documentType.category
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Document Completion</p>
            <p className="text-xs text-slate-400 mt-0.5">{summary.verified} of {summary.total} required documents verified</p>
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{summary.completePct}%</span>
        </div>
        <Progress value={summary.completePct} className="h-2" />
        <div className="grid grid-cols-5 gap-2 pt-1">
          {[
            { label: 'Total', val: summary.total, color: 'text-slate-600' },
            { label: 'Verified', val: summary.verified, color: 'text-green-600' },
            { label: 'Pending', val: summary.pending, color: 'text-yellow-600' },
            { label: 'Rejected', val: summary.rejected, color: 'text-red-600' },
            { label: 'Missing', val: summary.missing, color: 'text-slate-400' },
          ].map((s) => (
            <div key={s.label} className="text-center rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
              <p className={cn('text-lg font-semibold', s.color)}>{s.val}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped checklist */}
      {Object.entries(grouped).map(([category, items]) => {
        const expanded = expandedCats.has(category)
        const toggle = () => setExpandedCats((prev) => { const next = new Set(prev); expanded ? next.delete(category) : next.add(category); return next })
        return (
          <div key={category} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2">
                {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{CATEGORY_LABELS[category] ?? category}</span>
                <Badge className="text-xs bg-white dark:bg-slate-700 border text-slate-500">{items.length}</Badge>
              </div>
              <div className="flex gap-1">
                {items.filter((i) => i.status === 'VERIFIED').length > 0 && (
                  <Badge className="text-xs bg-green-50 text-green-700 border-green-200">{items.filter((i) => i.status === 'VERIFIED').length} verified</Badge>
                )}
                {items.filter((i) => !i.uploaded && i.isRequired).length > 0 && (
                  <Badge className="text-xs bg-red-50 text-red-700 border-red-200">{items.filter((i) => !i.uploaded && i.isRequired).length} missing</Badge>
                )}
              </div>
            </button>

            {expanded && (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map((item: any) => (
                  <div key={item.documentType.id} className="px-4 py-3 bg-white dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.documentType.name}</span>
                          {item.isRequired && <span className="text-xs text-red-500">*required</span>}
                          <Badge className={cn('text-xs border', STATUS_CONFIG[item.status]?.cls ?? STATUS_CONFIG.MISSING.cls)}>
                            {STATUS_CONFIG[item.status]?.label ?? 'Missing'}
                          </Badge>
                        </div>
                        {item.uploaded && (
                          <div className="mt-1 text-xs text-slate-400 space-y-0.5">
                            <p>{item.uploaded.fileName} · {(item.uploaded.fileSize / 1024 / 1024).toFixed(2)}MB · {item.uploaded.uploadedBy.name} · {format(new Date(item.uploaded.createdAt), 'dd MMM yyyy')}</p>
                            {item.uploaded.verifiedBy && <p className="text-green-600">✓ Verified by {item.uploaded.verifiedBy.name}</p>}
                            {item.uploaded.rejectionReason && <p className="text-red-500">✗ {item.uploaded.rejectionReason}</p>}
                          </div>
                        )}
                        {item.request && !item.uploaded && (
                          <p className="text-xs text-blue-500 mt-1">
                            Requested · Due: {item.request.dueDate ? format(new Date(item.request.dueDate), 'dd MMM yyyy') : 'no due date'} · {item.request.reminderCount} reminder{item.request.reminderCount !== 1 ? 's' : ''} sent
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.uploaded && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleDownload(item.uploaded.id)} title="Download">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            {item.status === 'PENDING' && (
                              <>
                                <Button size="sm" className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handleVerify(item.uploaded.id)} disabled={isActioning}>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />Verify
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => setRejectDialog({ open: true, docId: item.uploaded.id, docName: item.documentType.name })}>
                                  <XCircle className="w-3 h-3 mr-1" />Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setUploadDialog({ open: true, item })} title="Re-upload">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {!item.uploaded && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setUploadDialog({ open: true, item })}>Upload</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50"
                              onClick={() => setRequestDialog({ open: true, typeId: item.documentType.id, typeName: item.documentType.name, category: item.documentType.category })}
                              disabled={!!item.request || isActioning}>
                              <Send className="w-3 h-3 mr-1" />
                              {item.request ? 'Requested' : 'Request'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Extra docs */}
      {extraDocuments?.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Additional Documents</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {extraDocuments.map((doc: any) => (
              <div key={doc.id} className="px-4 py-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{doc.fileName}</p>
                  <p className="text-xs text-slate-400">{doc.documentType.name} · {format(new Date(doc.createdAt), 'dd MMM yyyy')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={cn('text-xs border', STATUS_CONFIG[doc.status]?.cls ?? STATUS_CONFIG.MISSING.cls)}>{STATUS_CONFIG[doc.status]?.label ?? doc.status}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleDownload(doc.id)}><Download className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>The student will be notified and asked to re-upload.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">Document: <strong>{rejectDialog.docName}</strong></p>
            <div className="space-y-1.5">
              <Label>Rejection reason <span className="text-red-500">*</span></Label>
              <Textarea placeholder="e.g. Document is blurry and unreadable." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, docId: '', docName: '' })}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={rejectReason.length < 10 || isActioning} onClick={handleReject}>
              Reject & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request dialog */}
      <Dialog open={requestDialog.open} onOpenChange={(o) => setRequestDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Document from Student</DialogTitle>
            <DialogDescription>An email will be sent to {studentName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">Requesting: <strong>{requestDialog.typeName}</strong></p>
            {!studentEmail && (
              <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                ⚠ No email address on file. Add one to send email notifications.
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Message (optional)</Label>
              <Textarea placeholder="e.g. Please upload a clear scan of both sides." value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date (optional)</Label>
              <Input type="date" value={requestDueDate} onChange={(e) => setRequestDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialog({ open: false, typeId: '', typeName: '', category: 'OTHER' })}>Cancel</Button>
            <Button className="bg-sky-600 hover:bg-sky-700 text-white" disabled={isActioning} onClick={handleRequest}>
              <Send className="w-4 h-4 mr-2" />Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadDialog.open} onOpenChange={(o) => setUploadDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{uploadDialog.item?.uploaded ? 'Re-upload' : 'Upload'} Document</DialogTitle>
            <DialogDescription>{uploadDialog.item?.documentType?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {uploadDialog.item && (
              <DocUploader
                seekerId={seekerId}
                documentTypeId={uploadDialog.item.documentType.id}
                category={uploadDialog.item.documentType.category}
                acceptedFormats={uploadDialog.item.documentType.acceptedFormats}
                maxSizeMb={uploadDialog.item.documentType.maxSizeMb}
                documentName={uploadDialog.item.documentType.name}
                onSuccess={() => { setUploadDialog({ open: false, item: null }); fetchChecklist() }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
