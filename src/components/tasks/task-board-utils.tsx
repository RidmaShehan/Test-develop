import { Calendar, CheckCircle, CheckSquare, Clock, Play, Pause } from 'lucide-react'
import type { ReactNode } from 'react'

export function getTaskStatusIcon(status: string): ReactNode {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4" />
    case 'DONE':
      return <CheckSquare className="h-4 w-4" />
    case 'IN_PROGRESS':
      return <Play className="h-4 w-4" />
    case 'ON_HOLD':
      return <Pause className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

export function formatTaskDate(dateLike?: string | Date): string {
  const date = dateLike ? new Date(dateLike) : new Date()
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString()
}

export function getCalendarIcon(): ReactNode {
  return <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
}
