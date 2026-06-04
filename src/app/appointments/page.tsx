'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CalendarCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function AppointmentsPage() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/meetings?type=ONE_ON_ONE')
      .then((r) => r.json())
      .then((d) => setMeetings(d.data || d.meetings || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Appointments</h1>
          <p className="text-sm text-gray-600">One-on-one counseling sessions and appointments</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <CalendarCheck className="w-12 h-12 mb-3 opacity-30" />
            <p>No appointments found</p>
            <p className="text-xs mt-1">Appointments are one-on-one meetings. Create them from the Meetings page.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Title', 'With', 'Date & Time', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {meetings.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{m.title}</td>
                      <td className="px-4 py-3 text-slate-500">{m.assignedTo?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {m.scheduledAt ? format(new Date(m.scheduledAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', m.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : m.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800')}>
                          {m.status || 'SCHEDULED'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
