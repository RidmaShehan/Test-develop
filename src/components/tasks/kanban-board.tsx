'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TaskSearchFilter } from './task-search-filter'
import { CreateTaskDialog } from './create-task-dialog'
import { 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  Play,
  Pause,
  CheckSquare,
  History,
  MoreHorizontal,
  Eye
} from 'lucide-react'
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

const statusColumns = [
  { 
    id: 'OPEN', 
    title: 'Open', 
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock,
    headerColor: 'bg-slate-100 border-slate-200'
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
    icon: Play,
    headerColor: 'bg-amber-100 border-amber-200'
  },
  { 
    id: 'ON_HOLD', 
    title: 'On Hold', 
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Pause,
    headerColor: 'bg-orange-100 border-orange-200'
  },
  { 
    id: 'DONE', 
    title: 'Done', 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckSquare,
    headerColor: 'bg-green-100 border-green-200'
  },
  { 
    id: 'COMPLETED', 
    title: 'Completed', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    headerColor: 'bg-emerald-100 border-emerald-200'
  },
]

// Droppable Column Component
function DroppableColumn({ 
  column, 
  tasks, 
  onViewDetails, 
  onViewHistory 
}: { 
  column: { id: string; title: string; color: string; icon: any; headerColor: string }
  tasks: TaskItem[]
  onViewDetails: (task: TaskItem) => void
  onViewHistory: (task: TaskItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const IconComponent = column.icon

  return (
    <div className="w-full min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Professional Column Header */}
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
              onViewDetails={onViewDetails}
              onViewHistory={onViewHistory}
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
function SortableTaskCard({ task, onViewDetails, onViewHistory }: { 
  task: TaskItem
  onViewDetails: (task: TaskItem) => void
  onViewHistory: (task: TaskItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getStatusIcon = (status: string) => {
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md border-l-4 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-[1.02] shadow-sm'
      } ${
        task.type === 'regular' 
          ? 'border-l-blue-500 bg-white' 
          : 'border-l-purple-500 bg-white'
      }`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {task.type === 'regular' ? (
                <>
                  <p className="font-semibold text-sm text-gray-900 truncate leading-tight">{task.title}</p>
                  {task.assignedTo && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">Assigned to: {task.assignedTo.name}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-900 truncate leading-tight">{'seeker' in task ? task.seeker.fullName : 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{'seeker' in task ? task.seeker.phone : ''}</p>
                </>
              )}
            </div>
            <div 
              className="flex space-x-1 flex-shrink-0" 
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
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onViewDetails(task)
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                title="View Details"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                onClick={async (e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  onViewHistory(task)
                }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                title="View History"
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {task.type === 'regular' ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 font-medium ${
                    task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                    task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {task.priority}
                </Badge>
              </div>
              {task.dueDate && (
                <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                  <span className="truncate font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {task.description && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{task.description}</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 font-medium bg-purple-50 text-purple-700 border-purple-200"
                >
                  {'purpose' in task ? task.purpose.replace('_', ' ') : 'Task'}
                </Badge>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                <span className="truncate font-medium">{new Date('dueAt' in task ? task.dueAt : task.dueDate || new Date()).toLocaleDateString()}</span>
              </div>
              {'notes' in task && task.notes && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{task.notes}</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function KanbanBoard() {
  const [allTasks, setAllTasks] = useState<TaskItem[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyTask, setHistoryTask] = useState<TaskItem | null>(null)
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      // Fetch both FollowUpTasks and regular Tasks
      const [followUpTasksResponse, regularTasksResponse] = await Promise.all([
        fetch('/api/tasks').catch(err => {
          console.error('Error fetching followup tasks:', err)
          return { ok: false, json: async () => [] }
        }),
        fetch('/api/tasks/enhanced').catch(err => {
          console.error('Error fetching regular tasks:', err)
          return { ok: false, json: async () => [] }
        })
      ])

      const followUpTasks: FollowUpTask[] = followUpTasksResponse.ok ? await followUpTasksResponse.json() : []
      const regularTasks: RegularTask[] = regularTasksResponse.ok ? await regularTasksResponse.json() : []

      // Mark task types and normalize - ensure status is valid
      const markedFollowUpTasks: TaskItem[] = followUpTasks
        .filter(task => task && task.id && task.status) // Filter out invalid tasks
        .map(task => ({ ...task, type: 'followup' as const }))
      
      const markedRegularTasks: TaskItem[] = regularTasks
        .filter(task => task && task.id && task.status) // Filter out invalid tasks
        .map(task => ({ ...task, type: 'regular' as const }))

      // Combine both types
      const allTasksData = [...markedFollowUpTasks, ...markedRegularTasks]
      setAllTasks(allTasksData)
      setFilteredTasks(allTasksData)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      // Set empty arrays on error to prevent UI issues
      setAllTasks([])
      setFilteredTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilteredTasks = (tasks: TaskItem[]) => {
    setFilteredTasks(tasks)
  }

  const updateTaskStatus = async (taskId: string, newStatus: string, taskType?: string) => {
    try {
      let response
      if (taskType === 'regular') {
        // Update regular task via enhanced API
        response = await fetch(`/api/tasks/enhanced/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        })
      } else {
        // Update FollowUpTask via regular API
        response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        })
      }

      if (response.ok) {
        // Optimistically update the local state
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ))
        setFilteredTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ))
        
        // Refresh all tasks to get updated data including history
        await fetchTasks()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to update task status:', errorData)
        // Revert optimistic update by refreshing
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      // Revert optimistic update by refreshing
      await fetchTasks()
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Find task from allTasks to ensure we have the full task data
    const task = allTasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Find the task from allTasks to ensure we have the full task data
    const task = allTasks.find(t => t.id === taskId)
    if (!task) {
      console.error('Task not found:', taskId)
      return
    }

    // Get valid column statuses
    const validStatuses = statusColumns.map(col => col.id)
    
    // Check if dropped on a column (valid status)
    let newStatus: string | null = null
    if (validStatuses.includes(overId)) {
      // Dropped directly on a column
      newStatus = overId
    } else {
      // Dropped on another task - find which column that task is in
      const targetTask = allTasks.find(t => t.id === overId)
      if (targetTask) {
        newStatus = targetTask.status
      } else {
        // Couldn't find the target task or column, ignore the drop
        return
      }
    }

    // Check if status actually changed
    if (task.status === newStatus) {
      return
    }

    // Validate that the new status is a valid column
    if (!validStatuses.includes(newStatus)) {
      console.error('Invalid status:', newStatus)
      return
    }

    // Update the task status
    updateTaskStatus(taskId, newStatus, task.type)
  }

  const handleViewDetails = (task: TaskItem) => {
    setSelectedTask(task)
  }

  const handleViewHistory = async (task: TaskItem) => {
    // Don't set selectedTask to avoid opening details dialog
    // Use separate historyTask state instead
    if (task.type === 'regular') {
      // For regular tasks, we'll show a message that history tracking isn't available yet
      // In the future, we could show task comments or update history here
      setHistoryTask(task)
      setHistoryOpen(true)
    } else {
      // Fetch updated task with action history if needed
      try {
        const response = await fetch(`/api/tasks/${task.id}`)
        if (response.ok) {
          const updatedTask = await response.json()
          setHistoryTask(updatedTask)
          setHistoryOpen(true)
        } else {
          setHistoryTask(task)
          setHistoryOpen(true)
        }
      } catch (error) {
        console.error('Error fetching task history:', error)
        setHistoryTask(task)
        setHistoryOpen(true)
      }
    }
  }

  const getStatusIcon = (status: string) => {
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

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => {
      // Ensure status matches exactly (case-sensitive)
      return task.status === status
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading tasks...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Task Kanban Board</h2>
            <p className="text-sm text-gray-600">Manage your tasks with drag-and-drop workflow</p>
          </div>
          <CreateTaskDialog onTaskCreated={fetchTasks} />
        </div>

        {/* Search and Filter Component */}
        <TaskSearchFilter 
          tasks={allTasks} 
          onFilteredTasks={handleFilteredTasks}
        />

        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            
            return (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onViewDetails={handleViewDetails}
                onViewHistory={handleViewHistory}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 opacity-95 pointer-events-none shadow-2xl">
            <Card className={`w-[280px] border-l-4 shadow-xl ${
              activeTask.type === 'regular' 
                ? 'border-l-blue-500 bg-white' 
                : 'border-l-purple-500 bg-white'
            }`}>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {activeTask.type === 'regular' ? (
                        <>
                          <p className="font-medium text-sm truncate">{activeTask.title}</p>
                          {activeTask.assignedTo && (
                            <p className="text-xs text-gray-600 truncate">Assigned to: {activeTask.assignedTo.name}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-sm truncate">{'seeker' in activeTask ? activeTask.seeker.fullName : 'Unknown'}</p>
                          <p className="text-xs text-gray-600 truncate">{'seeker' in activeTask ? activeTask.seeker.phone : ''}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {activeTask.type === 'regular' ? (
                    <>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 font-medium ${
                          activeTask.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                          activeTask.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          activeTask.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {activeTask.priority}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0.5 font-medium bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {'purpose' in activeTask ? activeTask.purpose.replace('_', ' ') : 'Task'}
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DragOverlay>

      {/* Task Details Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 sm:space-y-6">
              {selectedTask.type === 'regular' ? (
                <>
                  <Card className="w-full overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Task Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Title</label>
                          <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{selectedTask.title}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                          <div>
                            <Badge className={`${statusColumns.find(col => col.id === selectedTask.status)?.color} text-xs sm:text-sm font-medium shadow-sm`}>
                              {selectedTask.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Priority</label>
                          <p className="text-sm sm:text-base text-gray-900">{selectedTask.priority}</p>
                        </div>
                        {selectedTask.dueDate && (
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-gray-700">Due Date</label>
                            <p className="text-sm sm:text-base text-gray-900">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {selectedTask.assignedTo && (
                          <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-gray-700">Assigned To</label>
                            <p className="text-sm sm:text-base text-gray-900">{selectedTask.assignedTo.name}</p>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Created By</label>
                          <p className="text-sm sm:text-base text-gray-900">{selectedTask.createdBy.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedTask.description && (
                    <Card className="w-full overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{selectedTask.description}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="w-full overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Change Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {statusColumns
                          .filter(col => col.id !== selectedTask.status)
                          .map((status) => (
                            <Button
                              key={status.id}
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm"
                              onClick={() => {
                                updateTaskStatus(selectedTask.id, status.id, selectedTask.type)
                                setSelectedTask(null)
                              }}
                            >
                              {status.title}
                            </Button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="w-full overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Task Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Seeker</label>
                          <div>
                            <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{'seeker' in selectedTask ? selectedTask.seeker.fullName : 'Unknown'}</p>
                            <p className="text-xs sm:text-sm text-gray-600 break-all">{'seeker' in selectedTask ? selectedTask.seeker.phone : ''}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Purpose</label>
                          <p className="text-sm sm:text-base text-gray-900">{'purpose' in selectedTask ? selectedTask.purpose.replace(/_/g, ' ') : 'N/A'}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Due Date</label>
                          <p className="text-sm sm:text-base text-gray-900">{new Date('dueAt' in selectedTask ? selectedTask.dueAt : selectedTask.dueDate || new Date()).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                          <div>
                            <Badge className={`${statusColumns.find(col => col.id === selectedTask.status)?.color} text-xs sm:text-sm font-medium shadow-sm`}>
                              {selectedTask.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {'notes' in selectedTask && selectedTask.notes && (
                    <Card className="w-full overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{selectedTask.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="w-full overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Change Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {statusColumns
                          .filter(col => col.id !== selectedTask.status)
                          .map((status) => (
                            <Button
                              key={status.id}
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm"
                              onClick={() => {
                                updateTaskStatus(selectedTask.id, status.id, selectedTask.type)
                                setSelectedTask(null)
                              }}
                            >
                              {status.title}
                            </Button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action History Dialog */}
      <Dialog open={historyOpen} onOpenChange={(open) => {
        setHistoryOpen(open)
        if (!open) {
          setHistoryTask(null)
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Action History</DialogTitle>
            {historyTask && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">
                    {historyTask.type === 'regular' ? historyTask.title : ('seeker' in historyTask ? historyTask.seeker.fullName : 'Unknown')}
                  </span>
                </div>
                {historyTask.type !== 'regular' && 'seeker' in historyTask && (
                  <span className="text-xs sm:text-sm text-gray-500 break-all">
                    {historyTask.seeker.phone}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>
          {historyTask && historyTask.type === 'regular' ? (
            <div className="space-y-4 overflow-hidden">
              <Card className="border-dashed">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-gray-900 mb-1">Action history tracking is not available for regular tasks yet.</p>
                  <p className="text-xs sm:text-sm text-gray-500">This feature will be available in a future update.</p>
                </CardContent>
              </Card>
            </div>
          ) : historyTask && historyTask.type !== 'regular' && (
            <div className="space-y-4 sm:space-y-6 overflow-hidden">
              {'actionHistory' in historyTask && historyTask.actionHistory && historyTask.actionHistory.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Card className="w-full overflow-hidden border shadow-sm">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="min-w-[120px] font-semibold text-gray-900">Action</TableHead>
                              <TableHead className="min-w-[120px] font-semibold text-gray-900">From</TableHead>
                              <TableHead className="min-w-[130px] font-semibold text-gray-900">To</TableHead>
                              <TableHead className="min-w-[140px] font-semibold text-gray-900">By</TableHead>
                              <TableHead className="min-w-[180px] font-semibold text-gray-900">Time</TableHead>
                              <TableHead className="min-w-[250px] font-semibold text-gray-900">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyTask.actionHistory
                              .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())
                              .map((action) => (
                              <TableRow key={action.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(action.toStatus)}
                                    <span className="text-sm font-medium">
                                      {action.fromStatus ? 'Moved' : 'Created'}
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
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs font-medium shadow-sm ${statusColumns.find(col => col.id === action.toStatus)?.color || 'bg-gray-100 text-gray-800'}`}
                                  >
                                    {action.toStatus.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-medium text-gray-700">{action.user.name}</TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  <div className="flex flex-col">
                                    <span>{new Date(action.actionAt).toLocaleDateString()}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(action.actionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm text-gray-700 line-clamp-2" title={action.notes || '-'}>
                                    {action.notes || '-'}
                                  </p>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-3">
                    {historyTask.actionHistory
                      .sort((a, b) => new Date(b.actionAt).getTime() - new Date(a.actionAt).getTime())
                      .map((action) => (
                      <Card key={action.id} className="overflow-hidden border shadow-sm">
                        <CardContent className="p-4 sm:p-5">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 pb-2 border-b border-gray-100">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {getStatusIcon(action.toStatus)}
                                <span className="text-sm font-semibold text-gray-900">
                                  {action.fromStatus ? 'Moved' : 'Created'}
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
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs font-medium shadow-sm w-fit ${statusColumns.find(col => col.id === action.toStatus)?.color || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {action.toStatus.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">By</p>
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
                    ))}
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
    </DndContext>
  )
}
