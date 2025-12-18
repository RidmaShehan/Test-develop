'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { AlertCircle, Clock, MapPin } from 'lucide-react'
import { safeJsonParse } from '@/lib/utils'
import { cn } from '@/lib/utils'

type CalendarEventType = 'meeting' | 'followup' | 'task'

type Person = {
  id?: string
  name?: string
  email?: string
}

type Seeker = {
  id?: string
  fullName?: string
  phone?: string
}

type CalendarEvent = {
  id: string
  type: CalendarEventType
  title: string
  start: string
  end?: string
  allDay?: boolean
  color?: string
  description?: string
  location?: string
  meetingLink?: string
  assignedTo?: Person | null
  createdBy?: Person | null
  seeker?: Seeker | null
  status?: string
}

type CalendarSummary = {
  meetings: number
  tasks: number
  regularTasks: number
  total: number
}

const defaultSummary: CalendarSummary = {
  meetings: 0,
  tasks: 0,
  regularTasks: 0,
  total: 0,
}

const typeLabels: Record<CalendarEventType, string> = {
  meeting: 'Meeting',
  followup: 'Follow-up',
  task: 'Task',
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [summary, setSummary] = useState<CalendarSummary>(defaultSummary)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/calendar')

        if (!response.ok) {
          throw new Error('Failed to fetch calendar events')
        }

        const data = await safeJsonParse(response)

        if (!isMounted) return

        setEvents(Array.isArray(data.events) ? data.events : [])
        setSummary({
          meetings: data.meetings ?? 0,
          tasks: data.tasks ?? 0,
          regularTasks: data.regularTasks ?? 0,
          total: data.total ?? (Array.isArray(data.events) ? data.events.length : 0),
        })
        setError(null)
      } catch (err) {
        console.error(err)
        if (!isMounted) return
        setError('We couldn’t load your calendar. Please try again.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchEvents()

    return () => {
      isMounted = false
    }
  }, [])

  const dayEvents = useMemo(() => {
    if (!selectedDate) return []

    return events.filter((event) => {
      const startDate = new Date(event.start)
      const endDate = event.end ? new Date(event.end) : startDate
      const interval = {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      }

      return isWithinInterval(selectedDate, interval)
    })
  }, [events, selectedDate])

  const formatEventTime = (event: CalendarEvent) => {
    const startDate = new Date(event.start)
    const endDate = event.end ? new Date(event.end) : startDate

    if (event.allDay) {
      return 'All day'
    }

    if (isSameDay(startDate, endDate)) {
      return `${format(startDate, 'h:mm a')} — ${format(endDate, 'h:mm a')}`
    }

    return `${format(startDate, 'MMM d, h:mm a')} — ${format(endDate, 'MMM d, h:mm a')}`
  }

  const selectedDateLabel = format(selectedDate, 'MMMM d, yyyy')
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const startDate = new Date(event.start)
      const endDate = event.end ? new Date(event.end) : startDate
      const interval = {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      }
      return isWithinInterval(date, interval)
    })
  }

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfMonth(monthStart)
    const endDate = endOfMonth(monthEnd)
    
    // Get first day of week (0 = Sunday)
    const firstDayOfWeek = getDay(monthStart)
    
    // Create array of all days to display
    const days: (Date | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in the month
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    days.push(...monthDays)
    
    // Fill remaining cells to complete the grid (6 rows x 7 columns = 42 cells)
    const remainingCells = 42 - days.length
    for (let i = 0; i < remainingCells; i++) {
      days.push(null)
    }
    
    return days
  }, [currentMonth])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header Section */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Calendar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View all of your scheduled meetings, follow-ups, and tasks in one place.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard title="Total Events" value={summary.total} subtitle="Everything on your calendar" />
          <SummaryCard title="Meetings" value={summary.meetings} subtitle="Scheduled conversations" />
          <SummaryCard title="Follow-ups" value={summary.tasks} subtitle="Seeker follow-up reminders" />
          <SummaryCard title="Tasks" value={summary.regularTasks} subtitle="General tasks with due dates" />
        </div>

        {/* Full Calendar View */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr,1fr]">
          {/* Full Calendar Grid */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                    aria-label="Previous month"
                  >
                    <span className="text-gray-600">‹</span>
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                    aria-label="Next month"
                  >
                    <span className="text-gray-600">›</span>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[80px] sm:min-h-[100px] rounded-md bg-gray-50/50 border border-transparent"
                      />
                    )
                  }

                  const isToday = isSameDay(day, new Date())
                  const isSelected = isSameDay(day, selectedDate)
                  const dayEvents = getEventsForDay(day)
                  const eventCount = dayEvents.length
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                  // Show up to 3 events, then show "+X more"
                  const visibleEvents = dayEvents.slice(0, 3)
                  const remainingCount = eventCount - visibleEvents.length

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[80px] sm:min-h-[100px] rounded-md border-2 transition-all duration-200 flex flex-col items-start p-1.5 sm:p-2 relative group",
                        isSelected
                          ? "bg-primary/5 text-primary border-primary shadow-md ring-2 ring-primary/20 z-10"
                          : isToday
                          ? "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100"
                          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300",
                        !isCurrentMonth && "opacity-40"
                      )}
                    >
                      {/* Date Number */}
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold mb-1",
                          isSelected && "text-primary",
                          isToday && !isSelected && "text-blue-700"
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Event Tags */}
                      <div className="flex flex-col gap-1 w-full flex-1 overflow-hidden">
                        {visibleEvents.map((event, idx) => {
                          const eventColor = event.color ?? '#4f46e5'
                          const getTypeColor = (type: string) => {
                            switch (type) {
                              case 'meeting':
                                return 'bg-blue-100 text-blue-700 border-blue-200'
                              case 'followup':
                                return 'bg-green-100 text-green-700 border-green-200'
                              case 'task':
                                return 'bg-orange-100 text-orange-700 border-orange-200'
                              default:
                                return 'bg-gray-100 text-gray-700 border-gray-200'
                            }
                          }

                          return (
                            <div
                              key={`${event.id}-${idx}`}
                              className={cn(
                                "text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded border truncate w-full text-left",
                                getTypeColor(event.type)
                              )}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          )
                        })}
                        
                        {remainingCount > 0 && (
                          <div className="text-[9px] sm:text-[10px] font-medium text-gray-500 px-1.5 py-0.5">
                            +{remainingCount} more
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events List for Selected Date */}
          <Card className="h-full shadow-sm border-gray-200 flex flex-col">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Events on <span className="text-primary">{selectedDateLabel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
              {loading && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <p className="text-sm text-muted-foreground">Loading your events…</p>
                </div>
              )}

              {!loading && dayEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">No events scheduled</p>
                  <p className="text-xs text-muted-foreground">This day is free</p>
                </div>
              )}

              {!loading && dayEvents.map((event) => (
                <div
                  key={`${event.type}-${event.id}`}
                  className="group flex gap-3 sm:gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30"
                >
                  {/* Event Indicator */}
                  <div className="flex-shrink-0 pt-0.5">
                    <div
                      className="h-3 w-3 rounded-full shadow-sm"
                    style={{ backgroundColor: event.color ?? '#4f46e5' }}
                  />
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
                    {/* Title and Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">{event.title}</h3>
                      <Badge 
                        variant="secondary" 
                        className="w-fit text-xs font-medium px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {typeLabels[event.type]}
                      </Badge>
                    </div>

                    {/* Time and Location */}
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{formatEventTime(event)}</span>
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{event.description}</p>
                    )}

                    {/* Metadata */}
                    {(event.assignedTo?.name || event.seeker?.fullName || event.status) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 border-t border-gray-100">
                        {event.assignedTo?.name && (
                          <span className="text-xs text-gray-500">
                            Assigned to <span className="font-medium text-gray-700">{event.assignedTo.name}</span>
                          </span>
                        )}
                        {event.seeker?.fullName && (
                          <span className="text-xs text-gray-500">
                            Seeker: <span className="font-medium text-gray-700">{event.seeker.fullName}</span>
                          </span>
                        )}
                        {event.status && (
                          <span className="text-xs text-gray-500">
                            Status: <span className="font-medium text-gray-700">{event.status.replace(/_/g, ' ')}</span>
                          </span>
                        )}
                    </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

type SummaryCardProps = {
  title: string
  value: number
  subtitle: string
}

function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2.5 sm:pb-3 bg-gray-50/30 border-b border-gray-100">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-5">
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">{value}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

