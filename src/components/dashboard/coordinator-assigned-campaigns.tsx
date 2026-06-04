'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Megaphone,
  Eye,
  Users,
  MousePointerClick,
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CoordinatorAssignedCampaign {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  status: string
  type: string
  startDate: string
  endDate: string | null
  reach: number | null
  views: number | null
  totalInteractions: number | null
  reactions: number | null
  comments: number | null
  shares: number | null
  linkClicks: number | null
  netFollows: number | null
  seekersCount: number
}

function statusRibbonClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-600 text-white'
    case 'DRAFT':
      return 'bg-slate-500 text-white'
    case 'PAUSED':
      return 'bg-amber-500 text-white'
    case 'COMPLETED':
      return 'bg-sky-600 text-white'
    case 'CANCELLED':
      return 'bg-red-600 text-white'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function formatInt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (s) => s.toUpperCase())
}

interface CoordinatorAssignedCampaignsProps {
  campaigns: CoordinatorAssignedCampaign[]
  loading?: boolean
  className?: string
}

export function CoordinatorAssignedCampaigns({
  campaigns,
  loading,
  className,
}: CoordinatorAssignedCampaignsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const scrollCards = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = Math.max(scrollRef.current.clientWidth * 0.8, 320)
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-xl border border-border bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          No campaigns are assigned to you yet. When an admin assigns you to a campaign, it will appear
          here with performance insights.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollCards('left')}
          aria-label="Scroll campaigns left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollCards('right')}
          aria-label="Scroll campaigns right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
      >
        {campaigns.map((c) => (
          <Card key={c.id} className="pt-0 gap-0 shadow-sm hover:shadow-md transition-shadow min-w-[320px] max-w-[360px] shrink-0">
            <div className="relative h-36">
              <div className="absolute inset-0 overflow-hidden rounded-t-xl bg-muted">
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <Megaphone className="h-12 w-12 text-muted-foreground/50" aria-hidden />
                  </div>
                )}
              </div>
              <div
                className={cn(
                  'pointer-events-none absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide shadow-sm',
                  statusRibbonClass(c.status)
                )}
                title={formatStatusLabel(c.status)}
              >
                {formatStatusLabel(c.status)}
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg leading-snug line-clamp-2">{c.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary" className="text-xs font-normal">
                  {c.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.startDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {c.endDate
                    ? ` – ${new Date(c.endDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Insights
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/60 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      Views
                    </div>
                    <div className="font-semibold tabular-nums">{formatInt(c.views)}</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      Reach
                    </div>
                    <div className="font-semibold tabular-nums">{formatInt(c.reach)}</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
                      Interactions
                    </div>
                    <div className="font-semibold tabular-nums">{formatInt(c.totalInteractions)}</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 px-2.5 py-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      In CRM
                    </div>
                    <div className="font-semibold tabular-nums">{c.seekersCount.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground border-t border-border/60 pt-2">
                  <span className="inline-flex items-center gap-0.5">
                    <Heart className="h-3 w-3" />
                    {formatInt(c.reactions)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <MessageCircle className="h-3 w-3" />
                    {formatInt(c.comments)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Share2 className="h-3 w-3" />
                    {formatInt(c.shares)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <MousePointerClick className="h-3 w-3" />
                    {formatInt(c.linkClicks)} clicks
                  </span>
                  {c.netFollows != null && (
                    <span>Net follows {formatInt(c.netFollows)}</span>
                  )}
                </div>
              </div>
              <Link
                href="/campaigns"
                className="inline-flex text-sm font-medium text-primary hover:underline"
              >
                Open campaigns
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
