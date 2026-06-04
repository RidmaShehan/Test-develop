'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeeklyReportFormDialog } from '@/components/weekly-reports/weekly-report-form-dialog'
import { WeeklyReportViewDialog } from '@/components/weekly-reports/weekly-report-view-dialog'
import type { WeeklyReportData } from '@/components/weekly-reports/weekly-report-form-dialog'
import {
  Plus,
  ClipboardList,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Target,
  BarChart3,
  AlertTriangle,
  Rocket,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVIEWED'

interface ReportSummary extends WeeklyReportData {
  id: string
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; email: string }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',     className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200' },
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200' },
  APPROVED:  { label: 'Approved',  className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200' },
  REVIEWED:  { label: 'Reviewed',  className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200' },
}

const fmtDate = (d: string | Date) => {
  try { return format(new Date(d), 'dd MMM yyyy') } catch { return '—' }
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg border p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Report Card ─────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onView,
  onEdit,
  onDelete,
}: {
  report: ReportSummary
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const badge = STATUS_BADGE[report.status] || STATUS_BADGE.DRAFT

  const plannedItems  = (report.plannedItems  as any[]) || []
  const dailyTasks    = (report.dailyTasks    as any[]) || []
  const risks         = (report.risks         as any[]) || []
  const nextWeekPlan  = (report.nextWeekPlan  as any[]) || []
  const achieved      = plannedItems.filter((i: any) => i.achieved).length

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left accent bar */}
          <div className={`w-full sm:w-1.5 flex-shrink-0 min-h-[4px] sm:min-h-0 ${
            report.status === 'APPROVED' ? 'bg-green-400' :
            report.status === 'SUBMITTED' ? 'bg-blue-400' :
            report.status === 'REVIEWED' ? 'bg-purple-400' :
            'bg-gray-300'
          }`} />

          <div className="flex-1 p-5">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug line-clamp-1">
                  {report.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {fmtDate(report.periodStart)} – {fmtDate(report.periodEnd)}
                  </span>
                  {report.activeDays && (
                    <span>{report.activeDays} active day{Number(report.activeDays) !== 1 ? 's' : ''}</span>
                  )}
                  <span className="text-gray-400">·</span>
                  <span>{report.developer}</span>
                  <span className="text-gray-400">·</span>
                  <span>{report.project}</span>
                </div>
              </div>
              <Badge className={`${badge.className} text-xs flex-shrink-0 border`}>
                {badge.label}
              </Badge>
            </div>

            {/* Summary excerpt */}
            {report.summary && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                {report.summary}
              </p>
            )}

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              {plannedItems.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {achieved}/{plannedItems.length} objectives
                </div>
              )}
              {dailyTasks.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  {dailyTasks.length} tasks logged
                </div>
              )}
              {risks.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  {risks.length} risk{risks.length !== 1 ? 's' : ''}
                </div>
              )}
              {nextWeekPlan.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Rocket className="w-3.5 h-3.5 text-purple-500" />
                  {nextWeekPlan.length} next-week items
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-1.5 p-3 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800 items-center justify-end sm:justify-center">
            <Button variant="ghost" size="sm" onClick={onView} className="h-8 px-2.5 text-xs gap-1.5">
              <Eye className="w-3.5 h-3.5" /> View
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2.5 text-xs gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}
              className="h-8 px-2.5 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyReportsPage() {
  const { user, loading: authLoading } = useAuth()

  const [reports, setReports]           = useState<ReportSummary[]>([])
  const [loading, setLoading]           = useState(false)
  const [activeTab, setActiveTab]       = useState<ReportStatus>('ALL')
  const [showForm, setShowForm]         = useState(false)
  const [editReport, setEditReport]     = useState<WeeklyReportData | null>(null)
  const [viewReport, setViewReport]     = useState<WeeklyReportData | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const qs = activeTab !== 'ALL' ? `?status=${activeTab}` : ''
      const res = await fetch(`/api/weekly-reports${qs}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (!authLoading && user) fetchReports()
  }, [authLoading, user, fetchReports])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/weekly-reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Report deleted')
        fetchReports()
      } else {
        toast.error('Failed to delete report')
      }
    } catch {
      toast.error('Failed to delete report')
    }
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditReport(null)
    fetchReports()
  }

  const openEdit = (report: ReportSummary) => {
    setEditReport({
      ...report,
      periodStart: report.periodStart ? report.periodStart.slice(0, 10) : '',
      periodEnd:   report.periodEnd   ? report.periodEnd.slice(0, 10)   : '',
      activeDays:  report.activeDays  ? String(report.activeDays)       : '',
    })
    setShowForm(true)
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const tabFilter = (status: ReportStatus) =>
    status === 'ALL' ? reports : reports.filter(r => r.status === status)

  const counts = {
    ALL:       reports.length,
    DRAFT:     reports.filter(r => r.status === 'DRAFT').length,
    SUBMITTED: reports.filter(r => r.status === 'SUBMITTED').length,
    APPROVED:  reports.filter(r => r.status === 'APPROVED').length,
    REVIEWED:  reports.filter(r => r.status === 'REVIEWED').length,
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">Please sign in to access weekly reports.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const displayed = tabFilter(activeTab)

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Weekly Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, submit, and track developer status reports in a standardised international format.
            </p>
          </div>
          <Button onClick={() => { setEditReport(null); setShowForm(true) }} size="lg">
            <Plus className="w-4 h-4 mr-2" /> New Report
          </Button>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="All Reports"    value={counts.ALL}       icon={ClipboardList} color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
          <StatCard label="Draft"          value={counts.DRAFT}     icon={Pencil}        color="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" />
          <StatCard label="Submitted"      value={counts.SUBMITTED} icon={BarChart3}     color="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" />
          <StatCard label="Approved"       value={counts.APPROVED}  icon={CheckCircle2}  color="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" />
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ReportStatus)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="ALL">All <span className="ml-1 text-xs opacity-60">({counts.ALL})</span></TabsTrigger>
            <TabsTrigger value="DRAFT">Draft <span className="ml-1 text-xs opacity-60">({counts.DRAFT})</span></TabsTrigger>
            <TabsTrigger value="SUBMITTED">Submitted <span className="ml-1 text-xs opacity-60">({counts.SUBMITTED})</span></TabsTrigger>
            <TabsTrigger value="APPROVED">Approved <span className="ml-1 text-xs opacity-60">({counts.APPROVED})</span></TabsTrigger>
            <TabsTrigger value="REVIEWED">Reviewed <span className="ml-1 text-xs opacity-60">({counts.REVIEWED})</span></TabsTrigger>
          </TabsList>

          {(['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REVIEWED'] as ReportStatus[]).map(status => (
            <TabsContent key={status} value={status} className="space-y-3 mt-0">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-base font-medium text-muted-foreground">
                      {status === 'ALL' ? 'No reports yet' : `No ${status.toLowerCase()} reports`}
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      {status === 'ALL'
                        ? 'Click "New Report" to create your first weekly status report.'
                        : 'Reports will appear here once their status matches.'}
                    </p>
                    {status === 'ALL' && (
                      <Button className="mt-4" onClick={() => { setEditReport(null); setShowForm(true) }}>
                        <Plus className="w-4 h-4 mr-2" /> Create First Report
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                displayed.map(report => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onView={() => setViewReport(report)}
                    onEdit={() => openEdit(report)}
                    onDelete={() => handleDelete(report.id)}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      <WeeklyReportFormDialog
        open={showForm}
        onOpenChange={open => { setShowForm(open); if (!open) setEditReport(null) }}
        initialData={editReport}
        onSaved={handleSaved}
        currentUserName={user?.name}
      />

      <WeeklyReportViewDialog
        open={viewReport !== null}
        onOpenChange={open => { if (!open) setViewReport(null) }}
        report={viewReport}
      />
    </DashboardLayout>
  )
}
