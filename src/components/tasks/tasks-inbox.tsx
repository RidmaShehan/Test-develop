'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TaskSearchFilter } from './task-search-filter'
import { CheckCircle, Clock, AlertCircle, User, Phone, Calendar } from 'lucide-react'

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

// Type guard to check if task is FollowUpTask
function isFollowUpTask(task: TaskItem): task is FollowUpTask {
  return 'purpose' in task && 'dueAt' in task && 'seeker' in task
}

export function TasksInbox() {
  const [allTasks, setAllTasks] = useState<TaskItem[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setAllTasks(data)
        setFilteredTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilteredTasks = (tasks: TaskItem[]) => {
    setFilteredTasks(tasks)
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
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
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
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
  const todayTasks = filteredTasks.filter((task): task is FollowUpTask => 
    isFollowUpTask(task) && new Date(task.dueAt).toDateString() === today && task.status === 'OPEN'
  )
  const overdueTasks = filteredTasks.filter((task): task is FollowUpTask => 
    isFollowUpTask(task) && isOverdue(task.dueAt) && task.status === 'OPEN'
  )
  const upcomingTasks = filteredTasks.filter((task): task is FollowUpTask => 
    isFollowUpTask(task) && new Date(task.dueAt) > new Date() && task.status === 'OPEN'
  )
  
  // Filter all tasks to only show follow-up tasks
  const followUpFilteredTasks = filteredTasks.filter((task): task is FollowUpTask => isFollowUpTask(task))

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
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>

      <TabsContent value="overdue" className="space-y-4">
        <TaskTable 
          tasks={overdueTasks} 
          title="Overdue Tasks"
          onUpdateStatus={updateTaskStatus}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        <TaskTable 
          tasks={upcomingTasks} 
          title="Upcoming Tasks"
          onUpdateStatus={updateTaskStatus}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        <TaskTable 
          tasks={followUpFilteredTasks} 
          title="All Tasks"
          onUpdateStatus={updateTaskStatus}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      </TabsContent>
    </Tabs>
    </div>
  )
}

interface TaskTableProps {
  tasks: FollowUpTask[]
  title: string
  onUpdateStatus: (taskId: string, status: string) => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}

function TaskTable({ tasks, title, onUpdateStatus, getStatusColor, getStatusIcon }: TaskTableProps) {
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
              {tasks.map((task) => (
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
                    <div className="flex space-x-2">
                      {task.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(task.id, 'DONE')}
                        >
                          Mark Done
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
