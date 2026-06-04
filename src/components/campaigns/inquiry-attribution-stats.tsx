'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, PieChart } from 'lucide-react'

interface CampaignRow {
  campaignId: string
  campaignName: string
  type: string | null
  status: string | null
  inquiryCount: number
  registeredCount: number
}

interface SourceRow {
  marketingSource: string
  inquiryCount: number
  registeredCount: number
}

export function InquiryAttributionStats() {
  const [loading, setLoading] = useState(true)
  const [byCampaign, setByCampaign] = useState<CampaignRow[]>([])
  const [bySource, setBySource] = useState<SourceRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/inquiries/attribution-stats')
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to load stats')
        }
        const data = await res.json()
        if (!cancelled) {
          setByCampaign(data.byCampaign || [])
          setBySource(data.byMarketingSource || [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load stats')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5" />
            Inquiry attribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading inquiry breakdown…
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5" />
            Inquiry attribution
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive py-4">{error}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="h-5 w-5" />
          Inquiry attribution
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Inquiries linked to a campaign, and totals by marketing source. Registered counts use
          inquiries marked register now. Scoped like the inquiry list: admins see all; others see
          only inquiries they created.
        </p>
      </CardHeader>
      <CardContent className="space-y-8 overflow-x-auto">
        <div>
          <h3 className="text-sm font-semibold mb-3">By campaign</h3>
          {byCampaign.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries linked to campaigns yet.</p>
          ) : (
            <div className="rounded-md border min-w-[520px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-2 font-medium">Campaign</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium text-right">Inquiries</th>
                    <th className="p-2 font-medium text-right">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {byCampaign.map((row) => (
                    <tr key={row.campaignId} className="border-b last:border-0">
                      <td className="p-2">
                        <div className="font-medium">{row.campaignName}</div>
                        {row.status && (
                          <Badge variant="outline" className="mt-1 text-xs font-normal">
                            {row.status}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {row.type?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="p-2 text-right tabular-nums">{row.inquiryCount}</td>
                      <td className="p-2 text-right tabular-nums">{row.registeredCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">By marketing source</h3>
          {bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inquiries recorded.</p>
          ) : (
            <div className="rounded-md border min-w-[480px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-2 font-medium">Source</th>
                    <th className="p-2 font-medium text-right">Inquiries</th>
                    <th className="p-2 font-medium text-right">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {bySource.map((row) => (
                    <tr key={row.marketingSource} className="border-b last:border-0">
                      <td className="p-2 font-medium">
                        {row.marketingSource.replace(/_/g, ' ')}
                      </td>
                      <td className="p-2 text-right tabular-nums">{row.inquiryCount}</td>
                      <td className="p-2 text-right tabular-nums">{row.registeredCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
