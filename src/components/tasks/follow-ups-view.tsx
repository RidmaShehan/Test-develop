'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Phone, 
  Calendar,
  Sparkles,
  Search,
  Filter,
  Eye,
  History,
  GripVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
}

export function FollowUpsView() {
  const [allTasks, setAllTasks] = useState<FollowUpTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<FollowUpTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [viewTask, setViewTask] = useState<FollowUpTask | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<FollowUpTask | null>(null)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<{ taskId: string; newStatus: string; fromStatus: string } | null>(null)
  const [moveComment, setMoveComment] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const statusColumns = [
    { 
      id: 'OPEN', 
      title: 'Open', 
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: Clock,
      headerColor: 'bg-yellow-100 border-yellow-200'
    },
    { 
      id: 'TODO', 
      title: 'To Do', 
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
      headerColor: 'bg-blue-100 border-blue-200'
    },
    { 
      id: 'IN_PROGRESS', 
      title: 'In Progress', 
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      headerColor: 'bg-amber-100 border-amber-200'
    },
    { 
      id: 'DONE', 
      title: 'Done', 
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle,
      headerColor: 'bg-green-100 border-green-200'
    },
    { 
      id: 'COMPLETED', 
      title: 'Completed', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      headerColor: 'bg-emerald-100 border-emerald-200'
    },
    { 
      id: 'ON_HOLD', 
      title: 'On Hold', 
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: AlertCircle,
      headerColor: 'bg-gray-100 border-gray-200'
    },
  ]

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [allTasks, searchQuery, statusFilter, typeFilter])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setAllTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = [...allTasks]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task =>
        task.seeker.fullName.toLowerCase().includes(query) ||
        task.seeker.phone.includes(query) ||
        task.notes?.toLowerCase().includes(query) ||
        task.purpose.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Type filter (automatic vs manual)
    if (typeFilter !== 'all') {
      if (typeFilter === 'automatic') {
        filtered = filtered.filter(task => 
          task.notes?.includes('Automatic follow-up') || false
        )
      } else if (typeFilter === 'manual') {
        filtered = filtered.filter(task => 
          !task.notes?.includes('Automatic follow-up')
        )
      }
    }

    // Sort by due date (soonest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.dueAt).getTime()
      const dateB = new Date(b.dueAt).getTime()
      return dateA - dateB
    })

    setFilteredTasks(filtered)
  }

  const isAutomatic = (task: FollowUpTask) => {
    return task.notes?.includes('Automatic follow-up') || false
  }

  const getFollowUpNumber = (task: FollowUpTask) => {
    const match = task.notes?.match(/#(\d+)/)?.[1] || ''
    return match
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock, label: 'Open' }
      case 'TODO':
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'To Do' }
      case 'IN_PROGRESS':
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'In Progress' }
      case 'DONE':
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Done' }
      case 'COMPLETED':
        return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Completed' }
      case 'OVERDUE':
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, label: 'Overdue' }
      default:
        return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock, label: status }
    }
  }

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date() && statusFilter !== 'DONE' && statusFilter !== 'COMPLETED'
  }

  const getDaysUntilDue = (dueAt: string) => {
    const due = new Date(dueAt)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleViewHistory = (task: FollowUpTask) => {
    setSelectedTask(task)
    setHistoryOpen(true)
  }

  const handleViewTask = (task: FollowUpTask) => {
    setViewTask(task)
    setViewOpen(true)
  }

  const updateTaskStatus = async (taskId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      if (response.ok) {
        // Update local state
        setAllTasks(prev => 
          prev.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        )
        setFilteredTasks(prev => 
          prev.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        )
        // Update view task if it's the same
        if (viewTask && viewTask.id === taskId) {
          setViewTask(prev => prev ? { ...prev, status: newStatus } : null)
        }
        // Refresh tasks to get updated action history
        await fetchTasks()
        toast.success('Task status updated successfully')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(errorData.error || 'Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = allTasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    const task = allTasks.find(t => t.id === taskId)
    if (!task) {
      console.error('Task not found:', taskId)
      return
    }

    const validStatuses = statusColumns.map(col => col.id)
    
    let newStatus: string | null = null
    if (validStatuses.includes(overId)) {
      newStatus = overId
    } else {
      const targetTask = allTasks.find(t => t.id === overId)
      if (targetTask) {
        newStatus = targetTask.status
      } else {
        return
      }
    }

    if (task.status === newStatus) {
      return
    }

    if (!validStatuses.includes(newStatus)) {
      console.error('Invalid status:', newStatus)
      return
    }

    // Show dialog to get comment
    setPendingMove({ taskId, newStatus, fromStatus: task.status })
    setMoveComment('')
    setMoveDialogOpen(true)
  }

  const handleConfirmMove = useCallback(async () => {
    if (!pendingMove) return

    await updateTaskStatus(pendingMove.taskId, pendingMove.newStatus, moveComment || undefined)
    setMoveDialogOpen(false)
    setPendingMove(null)
    setMoveComment('')
  }, [pendingMove, moveComment, updateTaskStatus])

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status)
  }

  // Keyboard shortcut handler for move dialog
  useEffect(() => {
    if (!moveDialogOpen || !pendingMove) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleConfirmMove()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [moveDialogOpen, pendingMove, handleConfirmMove])

  // Droppable Column Component
  function DroppableColumn({ 
    column, 
    tasks, 
    onViewHistory,
    onViewTask,
    getStatusInfo,
    isAutomatic,
    getFollowUpNumber,
    isOverdue,
    getDaysUntilDue,
    activeTaskId
  }: { 
    column: { id: string; title: string; color: string; icon: any; headerColor: string }
    tasks: FollowUpTask[]
    onViewHistory: (task: FollowUpTask) => void
    onViewTask: (task: FollowUpTask) => void
    getStatusInfo: (status: string) => any
    isAutomatic: (task: FollowUpTask) => boolean
    getFollowUpNumber: (task: FollowUpTask) => string
    isOverdue: (dueAt: string) => boolean
    getDaysUntilDue: (dueAt: string) => number
    activeTaskId?: string
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id: column.id,
    })

    const IconComponent = column.icon

    return (
      <div className="w-full min-w-[280px] max-w-[320px] flex-shrink-0">
        <div className={`flex items-center justify-between mb-3 px-3 py-2.5 rounded-t-lg border-b-2 ${column.headerColor} shadow-sm`}>
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
          </div>
          <Badge className={`${column.color} text-xs font-medium px-2 py-0.5 shadow-sm`}>
            {tasks.length > 999 ? '999+' : tasks.length}
          </Badge>
        </div>
        
        <SortableContext 
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div 
            ref={setNodeRef}
            className={`space-y-2.5 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto p-3 rounded-b-lg bg-gray-50/50 transition-all duration-200 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
              isOver 
                ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/80 shadow-lg' 
                : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onViewHistory={onViewHistory}
                onViewTask={onViewTask}
                getStatusInfo={getStatusInfo}
                isAutomatic={isAutomatic}
                getFollowUpNumber={getFollowUpNumber}
                isOverdue={isOverdue}
                getDaysUntilDue={getDaysUntilDue}
                isDragging={activeTaskId === task.id}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-500">No tasks</p>
                <p className="text-xs text-gray-400 mt-1">Drop tasks here</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    )
  }

  // Sortable Task Card Component
  function SortableTaskCard({ 
    task, 
    onViewHistory, 
    onViewTask,
    getStatusInfo,
    isAutomatic,
    getFollowUpNumber,
    isOverdue,
    getDaysUntilDue,
    isDragging
  }: { 
    task: FollowUpTask
    onViewHistory: (task: FollowUpTask) => void
    onViewTask: (task: FollowUpTask) => void
    getStatusInfo: (status: string) => any
    isAutomatic: (task: FollowUpTask) => boolean
    getFollowUpNumber: (task: FollowUpTask) => string
    isOverdue: (dueAt: string) => boolean
    getDaysUntilDue: (dueAt: string) => number
    isDragging: boolean
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: task.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const statusInfo = getStatusInfo(task.status)
    const automatic = isAutomatic(task)
    const followUpNumber = getFollowUpNumber(task)
    const overdue = isOverdue(task.dueAt)
    const daysUntil = getDaysUntilDue(task.dueAt)
    const StatusIcon = statusInfo.icon

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md border-l-4 ${
          isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02] shadow-sm'
        } ${
          automatic ? 'border-l-blue-500 bg-white' : 'border-l-purple-500 bg-white'
        } ${overdue ? 'border-l-red-500' : ''}`}
        {...attributes}
        {...listeners}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
                  {task.seeker.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {task.seeker.phone}
                </p>
              </div>
              {automatic && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex-shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Auto #{followUpNumber}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${statusInfo.color} text-xs font-medium px-2 py-0.5`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {task.purpose.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
              <span className="truncate font-medium">
                {new Date(task.dueAt).toLocaleDateString()}
              </span>
            </div>

            {task.notes && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {task.notes}
              </p>
            )}

            {/* Only show action buttons when not dragging */}
            {!isDragging && (
              <div 
                className="flex gap-2 pt-2 border-t"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onViewHistory(task)
                  }}
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onViewTask(task)
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            )}

            {/* Show move indicator when dragging */}
            {isDragging && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t text-xs text-gray-500">
                <GripVertical className="h-4 w-4" />
                <span>Moving...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const automaticCount = allTasks.filter(isAutomatic).length
  const manualCount = allTasks.length - automaticCount
  const overdueCount = allTasks.filter(task => isOverdue(task.dueAt)).length

  return (
    <>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Follow-ups</p>
                  <p className="text-2xl font-bold text-gray-900">{allTasks.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Automatic</p>
                  <p className="text-2xl font-bold text-blue-600">{automaticCount}</p>
                </div>
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Manual</p>
                  <p className="text-2xl font-bold text-gray-600">{manualCount}</p>
                </div>
                <User className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, phone, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        {filteredTasks.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No follow-ups found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {statusColumns.map((column) => {
                const columnTasks = getTasksByStatus(column.id)
                return (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    tasks={columnTasks}
                    onViewHistory={handleViewHistory}
                    onViewTask={handleViewTask}
                    getStatusInfo={getStatusInfo}
                    isAutomatic={isAutomatic}
                    getFollowUpNumber={getFollowUpNumber}
                    isOverdue={isOverdue}
                    getDaysUntilDue={getDaysUntilDue}
                    activeTaskId={activeTask?.id}
                  />
                )
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="rotate-2 opacity-95 pointer-events-none shadow-2xl">
                  <Card className={`w-[280px] border-l-4 shadow-xl ${
                    isAutomatic(activeTask) ? 'border-l-blue-500 bg-white' : 'border-l-purple-500 bg-white'
                  }`}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate leading-tight">
                              {activeTask.seeker.fullName}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {activeTask.seeker.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium bg-purple-50 text-purple-700 border-purple-200">
                            {activeTask.purpose.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                          <span className="truncate font-medium">
                            {new Date(activeTask.dueAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Move Comment Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setMoveDialogOpen(false)
          setPendingMove(null)
          setMoveComment('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">Add Comment</DialogTitle>
          </DialogHeader>
          {pendingMove && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status Change</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getStatusInfo(pendingMove.fromStatus).label}
                  </Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className={`${getStatusInfo(pendingMove.newStatus).color} text-xs`}>
                    {getStatusInfo(pendingMove.newStatus).label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moveComment" className="text-sm font-medium">
                  Comment (Optional)
                </Label>
                <Textarea
                  id="moveComment"
                  value={moveComment}
                  onChange={(e) => setMoveComment(e.target.value)}
                  placeholder="Add a comment about this status change..."
                  rows={4}
                  className="resize-none"
                  onKeyDown={(e) => {
                    // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleConfirmMove()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMoveDialogOpen(false)
                    setPendingMove(null)
                    setMoveComment('')
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmMove}>
                  Confirm Move
                  <span className="ml-2 text-xs text-gray-500 opacity-70">
                    {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+Enter
                  </span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={viewOpen} onOpenChange={(open) => {
        setViewOpen(open)
        if (!open) {
          setViewTask(null)
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Follow-up Task Details</DialogTitle>
          </DialogHeader>
          {viewTask && (
            <div className="space-y-4 sm:space-y-6">
              {/* Task Information Card */}
              <Card className="w-full overflow-hidden border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-semibold">Task Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Seeker</label>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{viewTask.seeker.fullName}</p>
                        <p className="text-xs sm:text-sm text-gray-600 break-all">{viewTask.seeker.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Purpose</label>
                      <p className="text-sm sm:text-base text-gray-900">{viewTask.purpose.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Due Date</label>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          {new Date(viewTask.dueAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {new Date(viewTask.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                      <div>
                        <Badge className={`${getStatusInfo(viewTask.status).color} text-xs sm:text-sm font-medium shadow-sm`}>
                          {(() => {
                            const StatusIcon = getStatusInfo(viewTask.status).icon
                            return (
                              <>
                                <StatusIcon className="h-3 w-3 mr-1 inline" />
                                {getStatusInfo(viewTask.status).label}
                              </>
                            )
                          })()}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Assigned To</label>
                      <p className="text-sm sm:text-base text-gray-900">{viewTask.user.name}</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Created At</label>
                      <p className="text-sm sm:text-base text-gray-900">
                        {new Date(viewTask.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              {viewTask.notes && (
                <Card className="w-full overflow-hidden border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg font-semibold">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{viewTask.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Change Status Card */}
              <Card className="w-full overflow-hidden border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-semibold">Change Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {['OPEN', 'TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED', 'ON_HOLD'].filter(
                      status => status !== viewTask.status
                    ).map((status) => {
                      const statusInfo = getStatusInfo(status)
                      const StatusIcon = statusInfo.icon
                      return (
                        <Button
                          key={status}
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() => {
                            updateTaskStatus(viewTask.id, status)
                          }}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Action History</DialogTitle>
            {selectedTask && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">
                    {selectedTask.seeker.fullName}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 break-all">
                  {selectedTask.seeker.phone}
                </span>
              </div>
            )}
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 sm:space-y-6 overflow-hidden">
              {selectedTask.actionHistory.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Card className="w-full overflow-hidden border shadow-sm">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="min-w-[180px] font-semibold text-gray-900">Date</TableHead>
                              <TableHead className="min-w-[120px] font-semibold text-gray-900">From</TableHead>
                              <TableHead className="min-w-[130px] font-semibold text-gray-900">To</TableHead>
                              <TableHead className="min-w-[140px] font-semibold text-gray-900">User</TableHead>
                              <TableHead className="min-w-[250px] font-semibold text-gray-900">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTask.actionHistory
                              .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())
                              .map((action) => {
                                const statusInfo = getStatusInfo(action.toStatus)
                                return (
                                  <TableRow key={action.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700">
                                          {formatDistanceToNow(new Date(action.actionAt), { addSuffix: true })}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(action.actionAt).toLocaleString()}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {action.fromStatus ? (
                                        <Badge variant="outline" className="text-xs font-medium">
                                          {action.fromStatus.replace(/_/g, ' ')}
                                        </Badge>
                                      ) : (
                                        <span className="text-gray-500 text-xs">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`text-xs font-medium shadow-sm ${statusInfo.color}`}>
                                        {action.toStatus.replace(/_/g, ' ')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-gray-700">{action.user.name}</TableCell>
                                    <TableCell>
                                      <p className="text-sm text-gray-700 line-clamp-2" title={action.notes || '-'}>
                                        {action.notes || '-'}
                                      </p>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-3">
                    {selectedTask.actionHistory
                      .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())
                      .map((action) => {
                        const statusInfo = getStatusInfo(action.toStatus)
                        return (
                          <Card key={action.id} className="overflow-hidden border shadow-sm">
                            <CardContent className="p-4 sm:p-5">
                              <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 pb-2 border-b border-gray-100">
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    {(() => {
                                      const StatusIcon = statusInfo.icon
                                      return <StatusIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    })()}
                                    <span className="text-sm font-semibold text-gray-900">
                                      {formatDistanceToNow(new Date(action.actionAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(action.actionAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-wrap gap-2">
                                  {action.fromStatus && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs text-gray-500">From</span>
                                      <Badge variant="outline" className="text-xs font-medium w-fit">
                                        {action.fromStatus.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500">To</span>
                                    <Badge className={`text-xs font-medium shadow-sm w-fit ${statusInfo.color}`}>
                                      {action.toStatus.replace(/_/g, ' ')}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">User</p>
                                    <p className="text-sm font-medium text-gray-700">{action.user.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Time</p>
                                    <p className="text-sm text-gray-700">
                                      {new Date(action.actionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {action.notes && (
                                    <div className="sm:col-span-2">
                                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                                      <p className="text-sm text-gray-700 break-words">{action.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mb-1">No action history found</p>
                    <p className="text-xs sm:text-sm text-gray-500">Action history will appear here when status changes are made</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

