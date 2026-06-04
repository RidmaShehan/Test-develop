'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { GraduationCap, FileText, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SeekerProfile {
  id: string; fullName: string; email: string; phone: string; stage: string
  program: { id: string; name: string; campus: string } | null
}

interface ChecklistSummary { total: number; uploaded: number; pending: number }

export default function PortalHomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [summary, setSummary] = useState<ChecklistSummary | null>(null)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [pendingInvoices, setPendingInvoices] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, checkRes, invRes] = await Promise.all([
          fetch(`/api/portal/${token}/me`),
          fetch(`/api/portal/${token}/checklist`),
          fetch(`/api/portal/${token}/invoices`),
        ])
        const meData = await meRes.json()
        if (!meData.success) { setError(meData.error || 'Invalid link'); return }
        setProfile(meData.data)

        const checkData = await checkRes.json()
        if (checkData.success) setSummary(checkData.data.summary)

        const invData = await invRes.json()
        if (invData.success) {
          setInvoiceCount(invData.data.length)
          setPendingInvoices(invData.data.filter((i: any) => i.status !== 'PAID').length)
        }
      } catch { setError('Failed to load portal') }
      finally { setIsLoading(false) }
    }
    load()
  }, [token])

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <h2 className="text-xl font-semibold text-red-600">{error}</h2>
      <p className="text-slate-500 text-sm">This link may have expired. Please request a new one.</p>
    </div>
  )

  const docPct = summary && summary.total > 0 ? Math.round((summary.uploaded / summary.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Welcome, {profile?.fullName}!</h1>
            {profile?.program && (
              <p className="text-sm text-slate-500 mt-1">{profile.program.name} — {profile.program.campus}</p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Progress Ring + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Doc progress */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center text-center">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
            <circle
              cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6"
              className="text-primary transition-all duration-500"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - docPct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <p className="mt-2 text-2xl font-bold text-primary -mt-2">{docPct}%</p>
          <p className="text-xs text-slate-500 mt-1">Documents Complete</p>
          {summary && <p className="text-xs text-slate-400">{summary.uploaded}/{summary.total} verified</p>}
        </div>

        {/* Pending docs */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center justify-center text-center gap-2">
          <Clock className="w-8 h-8 text-amber-500" />
          <p className="text-2xl font-bold text-amber-600">{summary?.pending ?? 0}</p>
          <p className="text-xs text-slate-500">Pending Documents</p>
        </div>

        {/* Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center justify-center text-center gap-2">
          <CreditCard className="w-8 h-8 text-indigo-500" />
          <p className="text-2xl font-bold text-indigo-600">{pendingInvoices}</p>
          <p className="text-xs text-slate-500">Pending Invoices</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/portal/${token}/documents`} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-colors">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">My Documents</p>
            <p className="text-xs text-slate-500 mt-0.5">Upload required documents and track status</p>
          </div>
        </Link>
        <Link href={`/portal/${token}/payments`} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 dark:group-hover:bg-green-950/50 transition-colors">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">My Payments</p>
            <p className="text-xs text-slate-500 mt-0.5">View invoices and payment status</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
