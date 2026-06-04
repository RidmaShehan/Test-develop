'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LeadScoreBadge } from './lead-score-badge'
import { Phone, Mail, User, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface PipelineSeeker {
  id: string
  fullName: string
  phone: string
  email?: string
  stage: string
  preferredStatus?: number
  createdAt: string
  updatedAt: string
  programInterest?: { id: string; name: string; campus: string }
  assignments?: { coordinator: { id: string; name: string } }[]
  leadScore?: { score: number; tier: string } | null
}

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  ATTEMPTING_CONTACT: 'Attempting Contact',
  CONNECTED: 'Connected',
  QUALIFIED: 'Qualified',
  COUNSELING_SCHEDULED: 'Counseling Scheduled',
  CONSIDERING: 'Considering',
  READY_TO_REGISTER: 'Ready to Register',
  LOST: 'Lost',
}

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  ATTEMPTING_CONTACT: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
  CONNECTED: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  QUALIFIED: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
  COUNSELING_SCHEDULED: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
  CONSIDERING: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  READY_TO_REGISTER: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  LOST: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
}

const STAGE_HEADER_COLORS: Record<string, string> = {
  NEW: 'bg-slate-500',
  ATTEMPTING_CONTACT: 'bg-yellow-500',
  CONNECTED: 'bg-blue-500',
  QUALIFIED: 'bg-purple-500',
  COUNSELING_SCHEDULED: 'bg-indigo-500',
  CONSIDERING: 'bg-orange-500',
  READY_TO_REGISTER: 'bg-green-500',
  LOST: 'bg-red-500',
}

function SeekerCard({ seeker, isDragging }: { seeker: PipelineSeeker; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: seeker.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-none', isDragging && 'opacity-50')}
    >
      <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border border-slate-200 dark:border-slate-700">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div {...attributes} {...listeners} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
                <GripVertical className="w-4 h-4" />
              </div>
              <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{seeker.fullName}</p>
            </div>
            {seeker.leadScore && (
              <LeadScoreBadge score={seeker.leadScore.score} tier={seeker.leadScore.tier} size="sm" showScore={false} />
            )}
          </div>

          {seeker.programInterest && (
            <p className="text-xs text-slate-500 truncate">
              {seeker.programInterest.name} — {seeker.programInterest.campus}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{seeker.phone}</span>
            {seeker.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{seeker.email}</span>}
          </div>

          {seeker.assignments?.[0] && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <User className="w-3 h-3" />
              {seeker.assignments[0].coordinator.name}
            </div>
          )}

          <p className="text-xs text-slate-300 dark:text-slate-600">
            {formatDistanceToNow(new Date(seeker.updatedAt), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function PipelineColumn({
  stage,
  seekers,
  count,
}: {
  stage: string
  seekers: PipelineSeeker[]
  count: number
}) {
  return (
    <div className={cn('flex-shrink-0 w-64 rounded-xl border', STAGE_COLORS[stage])}>
      <div className={cn('flex items-center justify-between px-3 py-2 rounded-t-xl text-white', STAGE_HEADER_COLORS[stage])}>
        <span className="text-xs font-semibold uppercase tracking-wide">{STAGE_LABELS[stage] || stage}</span>
        <Badge className="bg-white/20 text-white text-xs px-1.5">{count}</Badge>
      </div>
      <SortableContext items={seekers.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-200px)] overflow-y-auto">
          {seekers.map((seeker) => (
            <SeekerCard key={seeker.id} seeker={seeker} />
          ))}
          {seekers.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4">No inquiries</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface PipelineData {
  columns: Record<string, PipelineSeeker[]>
  counts: Record<string, number>
  stageOrder: string[]
}

interface InquiryPipelineProps {
  data: PipelineData
  onRefresh: () => void
}

export function InquiryPipeline({ data, onRefresh }: InquiryPipelineProps) {
  const [columns, setColumns] = useState(data.columns)
  const [activeSeeker, setActiveSeeker] = useState<PipelineSeeker | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const findSeekerStage = useCallback((seekerId: string): string | null => {
    for (const [stage, seekers] of Object.entries(columns)) {
      if (seekers.find((s) => s.id === seekerId)) return stage
    }
    return null
  }, [columns])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const stage = findSeekerStage(active.id as string)
    if (stage) {
      const seeker = columns[stage].find((s) => s.id === active.id)
      setActiveSeeker(seeker || null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveSeeker(null)
    const { active, over } = event
    if (!over) return

    const fromStage = findSeekerStage(active.id as string)
    const toStage = data.stageOrder.includes(over.id as string) ? (over.id as string) : findSeekerStage(over.id as string)

    if (!fromStage || !toStage || fromStage === toStage) return

    // Optimistic update
    setColumns((prev) => {
      const seeker = prev[fromStage].find((s) => s.id === active.id)!
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((s) => s.id !== active.id),
        [toStage]: [...prev[toStage], { ...seeker, stage: toStage }],
      }
    })

    try {
      const res = await fetch('/api/inquiries/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seekerId: active.id, stage: toStage }),
      })
      if (!res.ok) throw new Error('Failed to update stage')
      toast.success(`Moved to ${STAGE_LABELS[toStage]}`)
    } catch {
      toast.error('Failed to update stage')
      setColumns(data.columns) // revert
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {data.stageOrder.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            seekers={columns[stage] || []}
            count={(columns[stage] || []).length}
          />
        ))}
      </div>
      <DragOverlay>
        {activeSeeker && (
          <div className="opacity-90 rotate-2 shadow-2xl w-64">
            <SeekerCard seeker={activeSeeker} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
