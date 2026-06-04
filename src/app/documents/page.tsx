'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Download, Search, FileText, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_BADGES: Record<string, string> = {
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  REQUESTED: 'bg-blue-100 text-blue-800 border-blue-200',
  MISSING: 'bg-slate-100 text-slate-600 border-slate-200',
  EXPIRED: 'bg-orange-100 text-orange-800 border-orange-200',
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status && status !== 'all') params.set('status', status)
      if (category && category !== 'all') params.set('category', category)
      const res = await fetch(`/api/documents/all?${params}`)
      const data = await res.json()
      if (data.success) setDocuments(data.data)
      else toast.error(data.error || 'Failed to fetch documents')
    } catch { toast.error('Network error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchDocuments() }, [status, category])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchDocuments() }

  async function handleDownload(docId: string, fileName: string) {
    const res = await fetch(`/api/documents/${docId}/download`)
    const json = await res.json()
    if (json.data?.url) window.open(json.data.url, '_blank')
  }

  async function handleVerify(docId: string) {
    const res = await fetch(`/api/documents/${docId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'VERIFY' }),
    })
    const json = await res.json()
    if (json.success) { toast.success('Document verified'); fetchDocuments() }
    else toast.error(json.error || 'Failed')
  }

  const counts = {
    total: documents.length,
    pending: documents.filter((d) => d.status === 'PENDING').length,
    verified: documents.filter((d) => d.status === 'VERIFIED').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Documents</h1>
            <p className="text-sm text-gray-600">Manage and verify student documents</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', val: counts.total, icon: FileText, color: 'text-slate-600' },
            { label: 'Pending', val: counts.pending, icon: Clock, color: 'text-yellow-600' },
            { label: 'Verified', val: counts.verified, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Rejected', val: counts.rejected, icon: XCircle, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
              <s.icon className={cn('w-8 h-8', s.color)} />
              <div>
                <p className={cn('text-2xl font-bold', s.color)}>{s.val}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by student, document name..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="IDENTITY">Identity</SelectItem>
              <SelectItem value="ACADEMIC">Academic</SelectItem>
              <SelectItem value="FINANCIAL">Financial</SelectItem>
              <SelectItem value="PROGRAM">Program</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Student', 'Document', 'Category', 'Status', 'Uploaded By', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{doc.seeker?.fullName}</p>
                        <p className="text-xs text-slate-400">{doc.seeker?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{doc.documentType?.name}</p>
                        <p className="text-xs text-slate-400">{doc.fileName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">{doc.documentType?.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs border', STATUS_BADGES[doc.status] ?? STATUS_BADGES.MISSING)}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{doc.uploadedBy?.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(doc.createdAt), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleDownload(doc.id, doc.fileName)} title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          {doc.status === 'PENDING' && (
                            <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => handleVerify(doc.id)}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />Verify
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
