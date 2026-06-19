'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TaskSearchFilter } from './task-search-filter'
import { CheckCircle, Clock, AlertCircle, User, Phone, Calendar, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { isTaskReadOnly } from '@/lib/task-constants'
import { onTasksRefreshNeeded, consumeTasksPendingRefresh } from '@/lib/tasks-refresh-sync'
import { useAuth } from '@/hooks/use-auth'

/** Unified task shape for display (follow-ups + normalized regular tasks from Create Task) */
interface FollowUpTask {
  id: string
  purpose: string
  status: string
  dueAt: string
  notes?: string
  createdAt: string
  assignedTo?: string
  createdById?: string
  seeker: {
    id: string
    fullName: string
    phone: string
    registerNow: boolean
    stage: string
    createdById?: string
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
  /** 'regular' = from Create Task (enhanced API); undefined/'followup' = seeker follow-up */
  taskType?: 'followup' | 'regular'
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

// Type guard to check if task is FollowUpTask (or normalized regular with same shape)
function isFollowUpTask(task: TaskItem): task is FollowUpTask {
  return 'purpose' in task && 'dueAt' in task && 'seeker' in task
}

/** Normalize enhanced task to same shape as follow-up for display in Task section */
function normalizeRegularTask(raw: {
  id: string
  title: string
  description?: string | null
  status: string
  dueDate?: string | null
  createdAt: string
  assignedTo?: { id: string; name: string } | null
  createdBy?: { id: string; name: string } | null
}): FollowUpTask {
  return {
    id: raw.id,
    purpose: 'Task',
    status: raw.status,
    dueAt: raw.dueDate || raw.createdAt,
    notes: raw.description || undefined,
    createdAt: raw.createdAt,
    assignedTo: raw.assignedTo?.id,
    createdById: raw.createdBy?.id,
    seeker: {
      id: '',
      fullName: raw.title,
      phone: '',
      registerNow: false,
      stage: '',
      createdById: raw.createdBy?.id,
    },
    user: {
      name: raw.assignedTo?.name || raw.createdBy?.name || 'Unassigned',
    },
    actionHistory: [],
    taskType: 'regular',
  }
}

export function TasksInbox() {
  const [allTasks, setAllTasks] = useState<FollowUpTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<FollowUpTask[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<FollowUpTask | null>(null)

  useEffect(() => {
    fetchTasks()
    consumeTasksPendingRefresh()
  }, [])

  useEffect(() => {
    const onTasksCreated = () => fetchTasks()
    window.addEventListener('tasks-created', onTasksCreated)
    return () => window.removeEventListener('tasks-created', onTasksCreated)
  }, [])

  useEffect(() => {
    return onTasksRefreshNeeded(fetchTasks)
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      // Fetch both follow-up tasks and enhanced tasks so newly created tasks appear here
      const [followUpRes, enhancedRes] = await Promise.all([
        fetch('/api/tasks', { cache: 'no-store' }),
        fetch('/api/tasks/enhanced', { cache: 'no-store' }),
      ])

      const followUpData = followUpRes.ok ? await followUpRes.json() : []
      const enhancedData = enhancedRes.ok ? await enhancedRes.json() : []

      const followUpList: FollowUpTask[] = Array.isArray(followUpData)
        ? followUpData
        : (followUpData?.tasks ?? [])
      const rawRegular = Array.isArray(enhancedData)
        ? enhancedData
        : (enhancedData?.tasks ?? [])

      const followUpWithType: FollowUpTask[] = followUpList
        .filter((t: FollowUpTask) => t?.id && t?.status)
        .map((t: FollowUpTask) => ({ ...t, taskType: 'followup' as const }))
      const regularNormalized: FollowUpTask[] = rawRegular
        .filter((r: { id?: string; status?: string }) => r?.id && r?.status)
        .map((r: { id: string; title: string; description?: string | null; status: string; dueDate?: string | null; createdAt: string; assignedTo?: { id: string; name: string } | null; createdBy?: { id: string; name: string } | null }) =>
          normalizeRegularTask(r)
        )

      const merged: FollowUpTask[] = [...followUpWithType, ...regularNormalized].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      )
      setAllTasks(merged)
      setFilteredTasks(merged)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setAllTasks([])
      setFilteredTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilteredTasks = (tasks: TaskItem[]) => {
    setFilteredTasks(tasks as FollowUpTask[])
  }

  const handleClothingStationAction = async (task: FollowUpTask, action: 'register_clothing_station' | 'not_interested_clothing_station') => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (response.ok) {
        const label = action === 'register_clothing_station' ? 'Registered' : 'Not interested'
        toast.success(`${label} by clothing station queue`, {
          description: `${task.seeker.fullName} - task(s) completed`,
          duration: 3000,
        })
        fetchTasks()
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(err.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Clothing station action error:', error)
      toast.error('Error updating task')
    }
  }

  const updateTaskStatus = async (taskId: string, status: string, taskType?: 'followup' | 'regular') => {
    try {
      const url = taskType === 'regular' ? `/api/tasks/enhanced/${taskId}` : `/api/tasks/${taskId}`
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setAllTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status } : task
          )
        )
        setFilteredTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, status } : task
          )
        )
        toast.success('Task status updated')
      } else {
        toast.error('Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Error updating task status')
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      const url = taskToDelete.taskType === 'regular'
        ? `/api/tasks/enhanced/${taskToDelete.id}`
        : `/api/tasks/${taskToDelete.id}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Task deleted successfully')

        setAllTasks(prev => prev.filter(t => t.id !== taskToDelete.id))
        setFilteredTasks(prev => prev.filter(t => t.id !== taskToDelete.id))

        setDeleteDialogOpen(false)
        setTaskToDelete(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error('Failed to delete task', {
          description: errorData.error || 'Could not delete task',
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Error deleting task')
    }
  }

  const handleDeleteClick = (task: FollowUpTask) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      DONE: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle className="h-4 w-4" />
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date() && new Date(dueAt).toDateString() !== new Date().toDateString()
  }

  const today = new Date().toDateString()
  // All merged tasks have dueAt (follow-ups and normalized regular tasks)
  const todayTasks = filteredTasks.filter((task): task is FollowUpTask => 
    'dueAt' in task && new Date(task.dueAt).toDateString() === today && task.status === 'OPEN'
  )
  const overdueTasks = filteredTasks.filter((task): task is FollowUpTask => 
    'dueAt' in task && isOverdue(task.dueAt) && task.status === 'OPEN'
  )
  const upcomingTasks = filteredTasks.filter((task): task is FollowUpTask => 
    'dueAt' in task && new Date(task.dueAt) > new Date() && task.status === 'OPEN'
  )
  const followUpFilteredTasks = filteredTasks

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
    <div className="space-y-6">
      {/* Search and Filter Component */}
      <TaskSearchFilter 
        tasks={allTasks} 
        onFilteredTasks={handleFilteredTasks}
      />

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Today ({todayTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Overdue ({overdueTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Upcoming ({upcomingTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>All ({followUpFilteredTasks.length})</span>
          </TabsTrigger>
        </TabsList>

      <TabsContent value="today" className="space-y-4">
        <TaskTable 
          tasks={todayTasks} 
          title="Today's Tasks"
          onUpdateStatus={updateTaskStatus}
          onClothingStationRegister={(t) => handleClothingStationAction(t, 'register_clothing_station')}
          onClothingStationNotInterested={(t) => handleClothingStationAction(t, 'not_interested_clothing_station')}
          onDelete={handleDeleteClick}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>

      <TabsContent value="overdue" className="space-y-4">
        <TaskTable 
          tasks={overdueTasks} 
          title="Overdue Tasks"
          onUpdateStatus={updateTaskStatus}
          onClothingStationRegister={(t) => handleClothingStationAction(t, 'register_clothing_station')}
          onClothingStationNotInterested={(t) => handleClothingStationAction(t, 'not_interested_clothing_station')}
          onDelete={handleDeleteClick}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        <TaskTable 
          tasks={upcomingTasks} 
          title="Upcoming Tasks"
          onUpdateStatus={updateTaskStatus}
          onClothingStationRegister={(t) => handleClothingStationAction(t, 'register_clothing_station')}
          onClothingStationNotInterested={(t) => handleClothingStationAction(t, 'not_interested_clothing_station')}
          onDelete={handleDeleteClick}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        <TaskTable 
          tasks={followUpFilteredTasks} 
          title="All Tasks"
          onUpdateStatus={updateTaskStatus}
          onClothingStationRegister={(t) => handleClothingStationAction(t, 'register_clothing_station')}
          onClothingStationNotInterested={(t) => handleClothingStationAction(t, 'not_interested_clothing_station')}
          onDelete={handleDeleteClick}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>
    </Tabs>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this task? This action cannot be undone.
            {taskToDelete && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="font-medium text-gray-900">{taskToDelete.seeker.fullName}</p>
                <p className="text-sm text-gray-600 mt-1">{taskToDelete.seeker.phone}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteTask}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  )
}

interface TaskTableProps {
  tasks: FollowUpTask[]
  title: string
  onUpdateStatus: (taskId: string, status: string, taskType?: 'followup' | 'regular') => void
  onClothingStationRegister: (task: FollowUpTask) => void
  onClothingStationNotInterested: (task: FollowUpTask) => void
  onDelete: (task: FollowUpTask) => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}

function TaskTable({ tasks, title, onUpdateStatus, onClothingStationRegister, onClothingStationNotInterested, onDelete, getStatusColor, getStatusIcon }: TaskTableProps) {
  const { user: currentUser } = useAuth()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seeker</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const isAdmin = currentUser?.role && ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER'].includes(currentUser.role)
                let canDelete = false
                if (task.taskType === 'regular') {
                  canDelete = !!isAdmin || (task.createdById === currentUser?.id)
                } else {
                  // follow-up task
                  const assignedToMe = task.assignedTo === currentUser?.id
                  const inquiryCreatedByMe = task.seeker.createdById === currentUser?.id
                  canDelete = !!isAdmin || (assignedToMe && inquiryCreatedByMe)
                }

                return (
                  <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.seeker.fullName}</p>
                      <p className="text-sm text-gray-600">{task.seeker.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {task.purpose.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(task.status)}
                        <span>{task.status}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(task.dueAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{task.user.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {task.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 items-center">
                      {task.taskType !== 'regular' && task.status !== 'COMPLETED' && !isTaskReadOnly(task.seeker.stage) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300"
                            onClick={() => onClothingStationRegister(task)}
                            title="Registered by clothing station queue"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Registration
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300"
                            onClick={() => onClothingStationNotInterested(task)}
                            title="Not interested - clothing station queue"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Not Interested
                          </Button>
                        </>
                      )}
                      {task.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(task.id, 'DONE', task.taskType)}
                        >
                          Mark Done
                        </Button>
                      )}
                      {task.seeker.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `tel:${task.seeker.phone}`}
                          title={`Call ${task.seeker.fullName}`}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onDelete(task)}
                          className="hover:bg-red-50 hover:text-red-600"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
