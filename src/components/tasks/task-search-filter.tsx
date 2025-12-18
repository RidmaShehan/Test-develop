'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Search, Filter, X, Clock, User, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface FollowUpTask {
  id: string
  purpose: string
  status: string
  dueAt: string
  notes?: string
  createdAt: string
  seeker: {
    id: string
    fullName: string
    phone: string
  }
  user: {
    name: string
  }
  actionHistory: {
    id: string
    fromStatus: string | null
    toStatus: string
    actionBy: string
    actionAt: string
    notes?: string
    user: {
      name: string
    }
  }[]
  type?: 'followup'
}

interface RegularTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  createdAt: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  type?: 'regular'
}

type TaskItem = FollowUpTask | RegularTask

interface TaskSearchFilterProps {
  tasks: TaskItem[]
  onFilteredTasks: (filteredTasks: TaskItem[]) => void
  className?: string
}

interface FilterState {
  searchQuery: string
  status: string[]
  assignee: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  purpose: string[]
  showOverdue: boolean
  showToday: boolean
}

const statusOptions = [
  { value: 'OPEN', label: 'Open', icon: Clock },
  { value: 'TODO', label: 'To Do', icon: Clock },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: Play },
  { value: 'ON_HOLD', label: 'On Hold', icon: Pause },
  { value: 'DONE', label: 'Done', icon: CheckCircle },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle },
]

const purposeOptions = [
  'FOLLOW_UP',
  'CALL_BACK',
  'MEETING',
  'DOCUMENT_REVIEW',
  'APPLICATION_SUPPORT',
  'OTHER'
]

export function TaskSearchFilter({ tasks, onFilteredTasks, className }: TaskSearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: [],
    assignee: [],
    dateRange: {},
    purpose: [],
    showOverdue: false,
    showToday: false,
  })

  const [showFilters, setShowFilters] = useState(false)

  // Get unique assignees from tasks
  const uniqueAssignees = useMemo(() => {
    const assignees = tasks.map(task => {
      if (task.type === 'regular') {
        return task.assignedTo?.name || task.createdBy.name
      }
      return 'user' in task ? task.user.name : ''
    })
    return Array.from(new Set(assignees.filter(Boolean)))
  }, [tasks])

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

    // Universal search across all fields
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(task => {
        if (task.type === 'regular') {
          return (
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.assignedTo?.name.toLowerCase().includes(query) ||
            task.createdBy.name.toLowerCase().includes(query) ||
            task.status.toLowerCase().includes(query) ||
            task.priority.toLowerCase().includes(query)
          )
        } else {
          return (
            ('seeker' in task && (task.seeker.fullName.toLowerCase().includes(query) || task.seeker.phone.includes(query))) ||
            ('purpose' in task && task.purpose.toLowerCase().includes(query)) ||
            ('notes' in task && task.notes?.toLowerCase().includes(query)) ||
            ('user' in task && task.user.name.toLowerCase().includes(query)) ||
            task.status.toLowerCase().includes(query)
          )
        }
      })
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status))
    }

    // Assignee filter
    if (filters.assignee.length > 0) {
      filtered = filtered.filter(task => {
        if (task.type === 'regular') {
          const assigneeName = task.assignedTo?.name || task.createdBy.name
          return filters.assignee.includes(assigneeName)
        } else {
          return 'user' in task ? filters.assignee.includes(task.user.name) : false
        }
      })
    }

    // Purpose filter (only for followup tasks)
    if (filters.purpose.length > 0) {
      filtered = filtered.filter(task => {
        if (task.type === 'regular') return true // Regular tasks don't have purpose
        return 'purpose' in task && filters.purpose.includes(task.purpose)
      })
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(task => {
        const taskDate = task.type === 'regular' 
          ? (task.dueDate ? new Date(task.dueDate) : null)
          : ('dueAt' in task ? new Date(task.dueAt) : null)
        
        if (!taskDate) return true // Include tasks without due dates
        
        if (filters.dateRange.from && taskDate < filters.dateRange.from) return false
        if (filters.dateRange.to && taskDate > filters.dateRange.to) return false
        return true
      })
    }

    // Special filters
    if (filters.showOverdue) {
      const now = new Date()
      filtered = filtered.filter(task => {
        const dueDate = task.type === 'regular'
          ? (task.dueDate ? new Date(task.dueDate) : null)
          : ('dueAt' in task ? new Date(task.dueAt) : null)
        
        if (!dueDate) return false
        return dueDate < now && task.status !== 'COMPLETED' && task.status !== 'DONE'
      })
    }

    if (filters.showToday) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      filtered = filtered.filter(task => {
        const dueDate = task.type === 'regular'
          ? (task.dueDate ? new Date(task.dueDate) : null)
          : ('dueAt' in task ? new Date(task.dueAt) : null)
        
        if (!dueDate) return false
        return dueDate >= today && dueDate < tomorrow
      })
    }

    return filtered
  }, [tasks, filters])

  // Update parent component with filtered tasks
  useEffect(() => {
    onFilteredTasks(filteredTasks)
  }, [filteredTasks, onFilteredTasks])

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }))
  }

  const handleStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const handleAssigneeToggle = (assignee: string) => {
    setFilters(prev => ({
      ...prev,
      assignee: prev.assignee.includes(assignee)
        ? prev.assignee.filter(a => a !== assignee)
        : [...prev.assignee, assignee]
    }))
  }

  const handlePurposeToggle = (purpose: string) => {
    setFilters(prev => ({
      ...prev,
      purpose: prev.purpose.includes(purpose)
        ? prev.purpose.filter(p => p !== purpose)
        : [...prev.purpose, purpose]
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      status: [],
      assignee: [],
      dateRange: {},
      purpose: [],
      showOverdue: false,
      showToday: false,
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.status.length > 0) count++
    if (filters.assignee.length > 0) count++
    if (filters.purpose.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.showOverdue) count++
    if (filters.showToday) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks by name, phone, purpose, notes, assignee, or status..."
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="space-y-1">
                  {statusOptions.map((status) => {
                    const Icon = status.icon
                    return (
                      <div
                        key={status.value}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                          filters.status.includes(status.value) && "bg-blue-50 border border-blue-200"
                        )}
                        onClick={() => handleStatusToggle(status.value)}
                      >
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status.value)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{status.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Assignee Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignee</label>
                <div className="space-y-1">
                  {uniqueAssignees.map((assignee) => (
                    <div
                      key={assignee}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.assignee.includes(assignee) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handleAssigneeToggle(assignee)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.assignee.includes(assignee)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <User className="h-4 w-4" />
                      <span className="text-sm">{assignee}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purpose Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <div className="space-y-1">
                  {purposeOptions.map((purpose) => (
                    <div
                      key={purpose}
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.purpose.includes(purpose) && "bg-blue-50 border border-blue-200"
                      )}
                      onClick={() => handlePurposeToggle(purpose)}
                    >
                      <input
                        type="checkbox"
                        checked={filters.purpose.includes(purpose)}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <span className="text-sm">{purpose.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range & Quick Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date & Quick Filters</label>
                <div className="space-y-2">
                  {/* Date Range */}
                  <div className="space-y-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            filters.dateRange.to ? (
                              `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to, 'MMM dd')}`
                            ) : (
                              format(filters.dateRange.from, 'MMM dd, yyyy')
                            )
                          ) : (
                            'Select date range'
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={filters.dateRange.from}
                          selected={filters.dateRange.from ? { from: filters.dateRange.from, to: filters.dateRange.to } : undefined}
                          onSelect={(range) => setFilters(prev => ({
                            ...prev,
                            dateRange: range || { from: undefined, to: undefined }
                          }))}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Quick Filters */}
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.showToday && "bg-orange-50 border border-orange-200"
                      )}
                      onClick={() => setFilters(prev => ({ ...prev, showToday: !prev.showToday }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.showToday}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Today</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50",
                        filters.showOverdue && "bg-red-50 border border-red-200"
                      )}
                      onClick={() => setFilters(prev => ({ ...prev, showOverdue: !prev.showOverdue }))}
                    >
                      <input
                        type="checkbox"
                        checked={filters.showOverdue}
                        onChange={() => {}}
                        className="rounded"
                      />
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Overdue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.searchQuery && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Search: "{filters.searchQuery}"</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  />
                </Badge>
              )}
              {filters.status.map(status => (
                <Badge key={status} variant="secondary" className="flex items-center space-x-1">
                  <span>Status: {status}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleStatusToggle(status)}
                  />
                </Badge>
              ))}
              {filters.assignee.map(assignee => (
                <Badge key={assignee} variant="secondary" className="flex items-center space-x-1">
                  <span>Assignee: {assignee}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleAssigneeToggle(assignee)}
                  />
                </Badge>
              ))}
              {filters.purpose.map(purpose => (
                <Badge key={purpose} variant="secondary" className="flex items-center space-x-1">
                  <span>Purpose: {purpose.replace('_', ' ')}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handlePurposeToggle(purpose)}
                  />
                </Badge>
              ))}
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>
                    Date: {filters.dateRange.from ? format(filters.dateRange.from, 'MMM dd') : 'Start'}
                    {' - '}
                    {filters.dateRange.to ? format(filters.dateRange.to, 'MMM dd') : 'End'}
                  </span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: {} }))}
                  />
                </Badge>
              )}
              {filters.showToday && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Today</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, showToday: false }))}
                  />
                </Badge>
              )}
              {filters.showOverdue && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Overdue</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, showOverdue: false }))}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
