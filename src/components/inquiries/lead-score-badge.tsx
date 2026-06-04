'use client'

import { cn } from '@/lib/utils'
import { Flame, TrendingUp, Snowflake } from 'lucide-react'

interface LeadScoreBadgeProps {
  score?: number | null
  tier?: string | null
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LeadScoreBadge({ score, tier, showScore = true, size = 'md' }: LeadScoreBadgeProps) {
  if (!tier && score == null) return null

  const resolvedTier = tier || (score != null ? (score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD') : 'COLD')

  const config: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    HOT: {
      label: 'Hot',
      bg: 'bg-red-100 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      icon: <Flame className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    WARM: {
      label: 'Warm',
      bg: 'bg-orange-100 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      icon: <TrendingUp className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    COLD: {
      label: 'Cold',
      bg: 'bg-blue-100 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      icon: <Snowflake className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
  }

  const cfg = config[resolvedTier] ?? config.COLD
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5 gap-1' : size === 'lg' ? 'text-sm px-3 py-1.5 gap-1.5' : 'text-xs px-2 py-1 gap-1'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border border-transparent',
        cfg.bg,
        cfg.text,
        sizeClass
      )}
    >
      {cfg.icon}
      {cfg.label}
      {showScore && score != null && (
        <span className="opacity-70 ml-0.5">({score})</span>
      )}
    </span>
  )
}
