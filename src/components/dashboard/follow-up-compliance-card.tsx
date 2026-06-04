'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ShieldCheck, Users, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ComplianceCoordinator = {
  coordinatorId: string
  coordinatorName: string
  coordinatorEmail: string
  activeInquiryCount: number
  breachCount: number
  complianceRate: number
}

type ComplianceResponse = {
  generatedAt: string
  breachThresholdHours: number
  summary: {
    coordinatorCount: number
    totalActiveInquiries: number
    totalBreaches: number
    overallComplianceRate: number
  }
  coordinators: ComplianceCoordinator[]
}

export function FollowUpComplianceCard() {
  const [data, setData] = useState<ComplianceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/tasks/compliance?hours=48', { cache: 'no-store' })
      if (!res.ok) {
        const details = await res.json().catch(() => ({}))
        throw new Error(details?.error || 'Failed to load compliance data')
      }
      const payload = (await res.json()) as ComplianceResponse
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompliance()
  }, [])

  const highRiskCoordinators = useMemo(
    () => (data?.coordinators || [])
      .filter((item) => item.breachCount > 0)
      .sort((a, b) => b.breachCount - a.breachCount || a.complianceRate - b.complianceRate)
      .slice(0, 5),
    [data]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            48h Follow-up Compliance
          </span>
          <Button variant="ghost" size="sm" onClick={fetchCompliance} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading coordinator compliance...</div>
        )}

        {!loading && error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Coordinators</div>
                <div className="text-2xl font-semibold">{data.summary.coordinatorCount}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Active Inquiries</div>
                <div className="text-2xl font-semibold">{data.summary.totalActiveInquiries}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">48h Breaches</div>
                <div className="text-2xl font-semibold text-red-600">{data.summary.totalBreaches}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Overall Compliance</div>
                <div className="text-2xl font-semibold">{data.summary.overallComplianceRate}%</div>
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b text-sm font-medium">Coordinator Risk View</div>
              <div className="divide-y">
                {highRiskCoordinators.length === 0 ? (
                  <div className="p-3 text-sm text-emerald-700 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    No 48-hour follow-up breaches right now.
                  </div>
                ) : (
                  highRiskCoordinators.map((item) => (
                    <div key={item.coordinatorId} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{item.coordinatorName}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.coordinatorEmail}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.activeInquiryCount}
                        </Badge>
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {item.breachCount} breaches
                        </Badge>
                        <Badge variant="secondary">{item.complianceRate}%</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Rule: admin is alerted when an active inquiry has no follow-up activity for more than{' '}
              {data.breachThresholdHours} hours.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
