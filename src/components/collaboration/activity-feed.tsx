'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  CheckSquare, 
  UserPlus, 
  Calendar, 
  FileText,
  Target,
  Building,
  Clock,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'COMMENT_ADDED' | 'USER_MENTIONED' | 'PROJECT_CREATED' | 'DEAL_UPDATED' | 'MEETING_SCHEDULED'
  title: string
  description: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  entity?: {
    type: 'task' | 'project' | 'deal' | 'meeting'
    id: string
    name: string
  }
  mentions?: Array<{
    id: string
    name: string
    email: string
  }>
}

interface ActivityFeedProps {
  projectId?: string
  userId?: string
  limit?: number
}

export function ActivityFeed({ projectId, userId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchActivities()
  }, [projectId, userId, filter])

  const fetchActivities = async () => {
    try {
      // This would be replaced with actual API call
      // For now, we'll simulate some activities
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'TASK_CREATED',
          title: 'Created new task',
          description: 'Created task "Design new landing page"',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          },
          entity: {
            type: 'task',
            id: '1',
            name: 'Design new landing page'
          }
        },
        {
          id: '2',
          type: 'COMMENT_ADDED',
          title: 'Added comment',
          description: 'Added a comment to "Design new landing page"',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          user: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          entity: {
            type: 'task',
            id: '1',
            name: 'Design new landing page'
          },
          mentions: [
            {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com'
            }
          ]
        },
        {
          id: '3',
          type: 'PROJECT_CREATED',
          title: 'Created project',
          description: 'Created new project "Website Redesign"',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          user: {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike@example.com'
          },
          entity: {
            type: 'project',
            id: '1',
            name: 'Website Redesign'
          }
        },
        {
          id: '4',
          type: 'DEAL_UPDATED',
          title: 'Deal updated',
          description: 'Updated deal "Enterprise License" to Negotiation stage',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          },
          entity: {
            type: 'deal',
            id: '1',
            name: 'Enterprise License'
          }
        },
        {
          id: '5',
          type: 'MEETING_SCHEDULED',
          title: 'Meeting scheduled',
          description: 'Scheduled meeting "Client Review" for tomorrow at 2:00 PM',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          user: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          entity: {
            type: 'meeting',
            id: '1',
            name: 'Client Review'
          }
        }
      ]

      let filteredActivities = mockActivities

      if (filter !== 'all') {
        filteredActivities = mockActivities.filter(activity => activity.type === filter)
      }

      setActivities(filteredActivities.slice(0, limit))
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
      case 'TASK_UPDATED':
      case 'TASK_COMPLETED':
        return <CheckSquare className="h-4 w-4" />
      case 'COMMENT_ADDED':
      case 'USER_MENTIONED':
        return <MessageSquare className="h-4 w-4" />
      case 'PROJECT_CREATED':
        return <Building className="h-4 w-4" />
      case 'DEAL_UPDATED':
        return <Target className="h-4 w-4" />
      case 'MEETING_SCHEDULED':
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'text-blue-600 bg-blue-100'
      case 'TASK_UPDATED':
        return 'text-yellow-600 bg-yellow-100'
      case 'TASK_COMPLETED':
        return 'text-green-600 bg-green-100'
      case 'COMMENT_ADDED':
        return 'text-purple-600 bg-purple-100'
      case 'USER_MENTIONED':
        return 'text-orange-600 bg-orange-100'
      case 'PROJECT_CREATED':
        return 'text-indigo-600 bg-indigo-100'
      case 'DEAL_UPDATED':
        return 'text-emerald-600 bg-emerald-100'
      case 'MEETING_SCHEDULED':
        return 'text-cyan-600 bg-cyan-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'Task Created'
      case 'TASK_UPDATED':
        return 'Task Updated'
      case 'TASK_COMPLETED':
        return 'Task Completed'
      case 'COMMENT_ADDED':
        return 'Comment Added'
      case 'USER_MENTIONED':
        return 'User Mentioned'
      case 'PROJECT_CREATED':
        return 'Project Created'
      case 'DEAL_UPDATED':
        return 'Deal Updated'
      case 'MEETING_SCHEDULED':
        return 'Meeting Scheduled'
      default:
        return 'Activity'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Feed</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'TASK_CREATED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('TASK_CREATED')}
          >
            Tasks
          </Button>
          <Button
            variant={filter === 'COMMENT_ADDED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('COMMENT_ADDED')}
          >
            Comments
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
            <p className="text-muted-foreground">
              Start collaborating to see team activities here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full',
                  getActivityColor(activity.type)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{activity.user.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-1">{activity.description}</p>
                  
                  {activity.entity && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>on</span>
                      <span className="font-medium">{activity.entity.name}</span>
                    </div>
                  )}
                  
                  {activity.mentions && activity.mentions.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Mentioned:</span>
                      {activity.mentions.map((mention, index) => (
                        <Badge key={mention.id} variant="outline" className="text-xs">
                          @{mention.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
