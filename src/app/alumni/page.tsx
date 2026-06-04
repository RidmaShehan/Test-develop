'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCheck, Search, Linkedin, Briefcase, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  EMPLOYED: 'bg-green-100 text-green-800 border-green-200',
  SELF_EMPLOYED: 'bg-blue-100 text-blue-800 border-blue-200',
  STUDYING: 'bg-purple-100 text-purple-800 border-purple-200',
  UNEMPLOYED: 'bg-red-100 text-red-800 border-red-200',
  UNKNOWN: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [engagementDialog, setEngagementDialog] = useState<any>(null)
  const [engType, setEngType] = useState('EMAIL')
  const [engNotes, setEngNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchAlumni = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/alumni?${params}`)
      const data = await res.json()
      if (data.success) setAlumni(data.data)
    } catch { toast.error('Failed to load alumni') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAlumni() }, [statusFilter])

  const logEngagement = async () => {
    if (!engType) { toast.error('Type is required'); return }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/alumni/${engagementDialog.id}/engagements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: engType, notes: engNotes }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Engagement logged')
        setEngagementDialog(null)
        setEngNotes('')
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed') }
    finally { setIsSubmitting(false) }
  }

  const stats = {
    total: alumni.length,
    employed: alumni.filter((a) => a.status === 'EMPLOYED').length,
    studying: alumni.filter((a) => a.status === 'STUDYING').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Alumni</h1>
          <p className="text-sm text-gray-600">Track and engage with former students</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Alumni', val: stats.total, icon: GraduationCap, color: 'text-slate-600' },
            { label: 'Employed', val: stats.employed, icon: Briefcase, color: 'text-green-600' },
            { label: 'Studying', val: stats.studying, icon: GraduationCap, color: 'text-purple-600' },
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
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <form onSubmit={(e) => { e.preventDefault(); fetchAlumni() }}>
              <Input placeholder="Search alumni..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="EMPLOYED">Employed</SelectItem>
              <SelectItem value="SELF_EMPLOYED">Self-employed</SelectItem>
              <SelectItem value="STUDYING">Studying</SelectItem>
              <SelectItem value="UNEMPLOYED">Unemployed</SelectItem>
              <SelectItem value="UNKNOWN">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : alumni.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <UserCheck className="w-12 h-12 mb-3 opacity-30" />
            <p>No alumni records found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alumni.map((a) => (
              <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{a.seeker?.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{a.seeker?.email}</p>
                  </div>
                  <Badge className={cn('text-xs border flex-shrink-0', STATUS_COLORS[a.status] ?? STATUS_COLORS.UNKNOWN)}>
                    {a.status?.replace('_', ' ')}
                  </Badge>
                </div>
                {a.program && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />{a.program.name} — {a.program.campus}
                  </p>
                )}
                {a.currentRole && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />{a.currentRole}{a.employer ? ` at ${a.employer}` : ''}
                  </p>
                )}
                {a.linkedinUrl && (
                  <a href={a.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 hover:underline">
                    <Linkedin className="w-3 h-3" />LinkedIn
                  </a>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Graduated {format(new Date(a.graduatedAt), 'MMM yyyy')}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEngagementDialog(a)}>
                    Log Engagement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Engagement Dialog */}
        <Dialog open={!!engagementDialog} onOpenChange={(o) => !o && setEngagementDialog(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Log Engagement — {engagementDialog?.seeker?.fullName}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={engType} onValueChange={setEngType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                    <SelectItem value="SURVEY">Survey</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="CALL">Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Optional notes..." value={engNotes} onChange={(e) => setEngNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEngagementDialog(null)}>Cancel</Button>
              <Button onClick={logEngagement} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Log'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
