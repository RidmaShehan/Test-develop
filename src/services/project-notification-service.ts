'use client'

import { useNotifications } from '@/contexts/notification-context'
import { useEffect, useRef } from 'react'

interface ProjectNotificationServiceProps {
  userId?: string
  projectId?: string
}

export function useProjectNotificationService({ userId, projectId }: ProjectNotificationServiceProps = {}) {
  const { addNotification } = useNotifications()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckRef = useRef<Date>(new Date())

  const checkProjectNotifications = async () => {
    try {
      // Check for new project activities
      const activitiesResponse = await fetch('/api/activities/recent')
      if (activitiesResponse.ok) {
        const activities = await activitiesResponse.json()
        
        // Filter activities since last check
        const newActivities = activities.filter((activity: any) => 
          new Date(activity.timestamp) > lastCheckRef.current
        )

        newActivities.forEach((activity: any) => {
          // Only notify if it's not from the current user
          if (activity.userId !== userId) {
            let notificationType: 'info' | 'success' | 'warning' | 'error' = 'info'
            let actionUrl = ''
            let actionText = 'View'

            switch (activity.type) {
              case 'TASK_CREATED':
                notificationType = 'info'
                actionUrl = `/projects?task=${activity.entityId}`
                actionText = 'View Task'
                break
              case 'TASK_UPDATED':
                notificationType = 'info'
                actionUrl = `/projects?task=${activity.entityId}`
                actionText = 'View Task'
                break
              case 'TASK_COMPLETED':
                notificationType = 'success'
                actionUrl = `/projects?task=${activity.entityId}`
                actionText = 'View Task'
                break
              case 'COMMENT_ADDED':
                notificationType = 'info'
                actionUrl = `/projects?comment=${activity.entityId}`
                actionText = 'View Comment'
                break
              case 'USER_MENTIONED':
                notificationType = 'warning'
                actionUrl = `/projects?mention=${activity.entityId}`
                actionText = 'View Mention'
                break
              case 'PROJECT_CREATED':
                notificationType = 'info'
                actionUrl = `/projects?project=${activity.entityId}`
                actionText = 'View Project'
                break
              case 'DEAL_UPDATED':
                notificationType = 'info'
                actionUrl = `/projects?deal=${activity.entityId}`
                actionText = 'View Deal'
                break
              case 'MEETING_SCHEDULED':
                notificationType = 'info'
                actionUrl = `/meetings?meeting=${activity.entityId}`
                actionText = 'View Meeting'
                break
            }

            addNotification({
              title: activity.title,
              message: activity.description,
              type: notificationType,
              actionUrl,
              actionText,
              entityType: activity.entityType,
              entityId: activity.entityId,
              fromUser: {
                id: activity.userId,
                name: activity.userName,
                email: activity.userEmail
              }
            })
          }
        })

        // Update last check time
        lastCheckRef.current = new Date()
      }
    } catch (error) {
      console.error('Error checking project notifications:', error)
    }
  }

  const checkTaskDeadlines = async () => {
    try {
      const response = await fetch('/api/tasks/enhanced?dueSoon=true')
      if (response.ok) {
        const tasks = await response.json()
        
        tasks.forEach((task: any) => {
          if (task.assignedToId === userId) {
            const dueDate = new Date(task.dueDate)
            const now = new Date()
            const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

            if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
              addNotification({
                title: 'Task Deadline Approaching',
                message: `Task "${task.title}" is due in ${Math.round(hoursUntilDue)} hours`,
                type: 'warning',
                actionUrl: `/projects?task=${task.id}`,
                actionText: 'View Task',
                entityType: 'task',
                entityId: task.id
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('Error checking task deadlines:', error)
    }
  }

  const checkDealUpdates = async () => {
    try {
      const response = await fetch('/api/deals?assignedTo=' + userId)
      if (response.ok) {
        const deals = await response.json()
        
        deals.forEach((deal: any) => {
          if (deal.assignedToId === userId) {
            const expectedCloseDate = new Date(deal.expectedCloseDate)
            const now = new Date()
            const daysUntilClose = (expectedCloseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

            if (daysUntilClose <= 7 && daysUntilClose > 0) {
              addNotification({
                title: 'Deal Closing Soon',
                message: `Deal "${deal.title}" is expected to close in ${Math.round(daysUntilClose)} days`,
                type: 'info',
                actionUrl: `/projects?deal=${deal.id}`,
                actionText: 'View Deal',
                entityType: 'deal',
                entityId: deal.id
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('Error checking deal updates:', error)
    }
  }

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    // Check for notifications every 30 seconds
    intervalRef.current = setInterval(() => {
      checkProjectNotifications()
      checkTaskDeadlines()
      checkDealUpdates()
    }, 30000)
    
    // Initial check
    checkProjectNotifications()
    checkTaskDeadlines()
    checkDealUpdates()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId, projectId, addNotification])

  return {
    checkProjectNotifications,
    checkTaskDeadlines,
    checkDealUpdates
  }
}
