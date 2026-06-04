'use client'

import { useNotifications } from '@/contexts/notification-context'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  meetingType?: string
  meetingLink?: string
  assignedTo: {
    name: string
    email: string
  }
}

interface FollowUpTask {
  id: string
  seekerId: string
  assignedTo: string
  dueAt: string
  purpose: string
  status: string
  notes?: string
  seeker?: {
    fullName: string
    phone: string
  }
}

interface Note {
  id: string
  title: string
  hasReminder: boolean
  reminderDate: string | null
  reminderSent: boolean
  notebookId?: string
  notebook?: {
    title: string
  }
}

interface EnhancedTask {
  id: string
  title: string
  dueDate: string | null
  assignedToId: string | null
  status: string
  projectId?: string
}

interface ComplianceSummary {
  breachThresholdHours: number
  summary: {
    totalBreaches: number
  }
}

export function useUnifiedReminderService() {
  const { addNotification, requestNotificationPermission } = useNotifications()
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const checkedRemindersRef = useRef<Set<string>>(new Set())

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Request permission after a short delay to avoid blocking
      setTimeout(() => {
        requestNotificationPermission().catch(console.error)
      }, 1000)
    }
  }, [user, requestNotificationPermission])

  const checkMeetingReminders = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/meetings')
      if (!response.ok) return

      const meetings: Meeting[] = await response.json()
      const now = new Date()
      const reminderTimes = [5, 15, 30, 60] // minutes before meeting

      meetings.forEach(meeting => {
        // Only check meetings assigned to current user
        if (meeting.assignedTo.email !== user.email) return

        const meetingStart = new Date(meeting.startTime)
        const timeUntilMeeting = meetingStart.getTime() - now.getTime()
        const minutesUntilMeeting = Math.floor(timeUntilMeeting / (1000 * 60))

        // Check if we should send a reminder
        reminderTimes.forEach(reminderMinutes => {
          if (minutesUntilMeeting === reminderMinutes && minutesUntilMeeting > 0) {
            const reminderKey = `meeting-${meeting.id}-${reminderMinutes}`
            
            // Only send reminder once per meeting per time interval
            if (!checkedRemindersRef.current.has(reminderKey)) {
              checkedRemindersRef.current.add(reminderKey)
              
              const meetingTypeText = meeting.meetingType ? 
                ` (${meeting.meetingType.replace(/_/g, ' ')})` : ''
              
              addNotification({
                title: `Meeting Reminder: ${meeting.title}`,
                message: `Your meeting "${meeting.title}"${meetingTypeText} starts in ${reminderMinutes} minutes.`,
                type: reminderMinutes <= 15 ? 'warning' : 'info',
                actionUrl: meeting.meetingLink || '/meetings',
                actionText: meeting.meetingLink ? 'Join Meeting' : 'View Meeting',
                entityType: 'meeting',
                entityId: meeting.id
              })

              // Clean up the reminder key after the meeting time has passed
              setTimeout(() => {
                checkedRemindersRef.current.delete(reminderKey)
              }, (reminderMinutes + 5) * 60 * 1000) // 5 minutes after meeting start
            }
          }
        })
      })
    } catch (error) {
      console.error('Error checking meeting reminders:', error)
    }
  }

  const checkFollowUpTaskReminders = async () => {
    if (!user) return

    try {
      // Fetch follow-up tasks directly from tasks endpoint
      const response = await fetch('/api/tasks')
      if (!response.ok) return

      const tasks: FollowUpTask[] = await response.json()

      const now = new Date()
      const reminderTimes = [60, 180, 1440] // 1 hour, 3 hours, 24 hours before due

      tasks.forEach(task => {
        // Only check tasks assigned to current user
        if (task.assignedTo !== user.id) return

        // Skip completed tasks
        if (task.status === 'DONE' || task.status === 'COMPLETED') return

        const dueDate = new Date(task.dueAt)
        const timeUntilDue = dueDate.getTime() - now.getTime()
        const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60))

        // Check if task is overdue (more than 5 minutes past due to avoid immediate notifications)
        if (minutesUntilDue < -5) {
          const reminderKey = `task-overdue-${task.id}`
          
          if (!checkedRemindersRef.current.has(reminderKey)) {
            checkedRemindersRef.current.add(reminderKey)
            
            const seekerName = task.seeker?.fullName || 'Unknown'
            addNotification({
              title: `Task Overdue: ${task.purpose}`,
              message: `Follow-up task for ${seekerName} is overdue. ${task.notes || ''}`,
              type: 'error',
              actionUrl: `/inquiries`,
              actionText: 'View Inquiry',
              entityType: 'task',
              entityId: task.id
            })
          }
        }

        // Check reminder times before due date (use range to catch reminders even if check is slightly off)
        reminderTimes.forEach(reminderMinutes => {
          // Check if we're within 2 minutes of the reminder time (to account for service check interval)
          const timeDiff = Math.abs(minutesUntilDue - reminderMinutes)
          if (timeDiff <= 2 && minutesUntilDue > 0) {
            const reminderKey = `task-${task.id}-${reminderMinutes}`
            
            if (!checkedRemindersRef.current.has(reminderKey)) {
              checkedRemindersRef.current.add(reminderKey)
              
              const seekerName = task.seeker?.fullName || 'Unknown'
              const hoursUntilDue = Math.floor(reminderMinutes / 60)
              const timeText = hoursUntilDue >= 24 
                ? `${Math.floor(hoursUntilDue / 24)} days`
                : hoursUntilDue >= 1
                ? `${hoursUntilDue} hours`
                : `${reminderMinutes} minutes`
              
              addNotification({
                title: `Task Reminder: ${task.purpose}`,
                message: `Follow-up task for ${seekerName} is due in ${timeText}. ${task.notes || ''}`,
                type: reminderMinutes <= 60 ? 'warning' : 'info',
                actionUrl: `/inquiries`,
                actionText: 'View Inquiry',
                entityType: 'task',
                entityId: task.id
              })

              // Clean up after due date passes
              setTimeout(() => {
                checkedRemindersRef.current.delete(reminderKey)
              }, (reminderMinutes + 60) * 60 * 1000)
            }
          }
        })
      })
    } catch (error) {
      console.error('Error checking follow-up task reminders:', error)
    }
  }

  const checkEnhancedTaskReminders = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/tasks/enhanced?dueSoon=true')
      if (response.ok) {
        const tasks: EnhancedTask[] = await response.json()
        const now = new Date()

        tasks.forEach((task) => {
          if (task.assignedToId !== user.id || !task.dueDate) return
          
          // Skip completed tasks
          if (task.status === 'DONE' || task.status === 'COMPLETED') return

          const dueDate = new Date(task.dueDate)
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          // Check if task is overdue (more than 1 hour past due)
          if (hoursUntilDue < -1) {
            const reminderKey = `enhanced-task-overdue-${task.id}`
            
            if (!checkedRemindersRef.current.has(reminderKey)) {
              checkedRemindersRef.current.add(reminderKey)
              
              addNotification({
                title: 'Task Overdue',
                message: `Task "${task.title}" is overdue`,
                type: 'error',
                actionUrl: task.projectId ? `/projects?task=${task.id}` : `/tasks`,
                actionText: 'View Task',
                entityType: 'task',
                entityId: task.id
              })
            }
          }
          // Check if task is due within 24 hours
          else if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
            const reminderKey = `enhanced-task-${task.id}`
            
            if (!checkedRemindersRef.current.has(reminderKey)) {
              checkedRemindersRef.current.add(reminderKey)
              
              addNotification({
                title: 'Task Deadline Approaching',
                message: `Task "${task.title}" is due in ${Math.round(hoursUntilDue)} hours`,
                type: 'warning',
                actionUrl: task.projectId ? `/projects?task=${task.id}` : `/tasks`,
                actionText: 'View Task',
                entityType: 'task',
                entityId: task.id
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('Error checking enhanced task reminders:', error)
    }
  }

  const checkNotebookReminders = async () => {
    if (!user) return

    try {
      // Fetch all notes with reminders
      const response = await fetch('/api/notes')
      if (!response.ok) return

      const notes: Note[] = await response.json()
      const now = new Date()

      notes.forEach(note => {
        // Only check notes with reminders that haven't been sent
        if (!note.hasReminder || !note.reminderDate || note.reminderSent) return

        const reminderDate = new Date(note.reminderDate)
        const timeUntilReminder = reminderDate.getTime() - now.getTime()
        const minutesUntilReminder = Math.floor(timeUntilReminder / (1000 * 60))

        // Send reminder if it's time (within 1 minute window) or if it's past due
        if ((minutesUntilReminder >= 0 && minutesUntilReminder <= 1) || minutesUntilReminder < 0) {
          const reminderKey = `note-${note.id}`
          
          if (!checkedRemindersRef.current.has(reminderKey)) {
            checkedRemindersRef.current.add(reminderKey)
            
            const notebookName = note.notebook?.title || 'Notebook'
            const isOverdue = minutesUntilReminder < 0
            
            addNotification({
              title: isOverdue 
                ? `Note Reminder (Overdue): ${note.title}`
                : `Note Reminder: ${note.title}`,
              message: isOverdue
                ? `Reminder for your note "${note.title}" in ${notebookName} is overdue.`
                : `Reminder for your note "${note.title}" in ${notebookName}`,
              type: isOverdue ? 'warning' : 'info',
              actionUrl: note.notebookId 
                ? `/notebooks/${note.notebookId}/notes/${note.id}`
                : `/notebooks`,
              actionText: 'View Note',
              entityType: 'note',
              entityId: note.id
            })

            // Mark reminder as sent in database
            fetch(`/api/notes/${note.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reminderSent: true })
            }).catch(console.error)

            // Clean up after reminder time passes
            setTimeout(() => {
              checkedRemindersRef.current.delete(reminderKey)
            }, 5 * 60 * 1000) // 5 minutes
          }
        }
      })
    } catch (error) {
      console.error('Error checking notebook reminders:', error)
    }
  }

  const checkCoordinatorComplianceAlerts = async () => {
    if (!user) return
    const isAdminUser = ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER'].includes(user.role)
    if (!isAdminUser) return

    try {
      const response = await fetch('/api/tasks/compliance?hours=48')
      if (!response.ok) return
      const data = (await response.json()) as ComplianceSummary
      const totalBreaches = data?.summary?.totalBreaches || 0
      if (totalBreaches <= 0) return

      const reminderKey = `compliance-breach-${totalBreaches}`
      if (checkedRemindersRef.current.has(reminderKey)) return

      checkedRemindersRef.current.add(reminderKey)
      addNotification({
        title: 'Coordinator Follow-up Breach Alert',
        message: `${totalBreaches} inquiry follow-ups have crossed ${data.breachThresholdHours} hours without activity.`,
        type: 'warning',
        actionUrl: '/dashboard',
        actionText: 'View Compliance',
        entityType: 'task',
      })

      setTimeout(() => {
        checkedRemindersRef.current.delete(reminderKey)
      }, 60 * 60 * 1000)
    } catch (error) {
      console.error('Error checking coordinator compliance alerts:', error)
    }
  }

  const checkAllReminders = async () => {
    if (!user) return

    try {
      await Promise.all([
        checkMeetingReminders(),
        checkFollowUpTaskReminders(),
        checkEnhancedTaskReminders(),
        checkNotebookReminders(),
        checkCoordinatorComplianceAlerts(),
      ])
    } catch (error) {
      console.error('Error in unified reminder service:', error)
    }
  }

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || !user) return

    // Check for reminders every minute
    intervalRef.current = setInterval(checkAllReminders, 60000)
    
    // Initial check after 2 seconds (to allow page to load)
    const initialTimeout = setTimeout(checkAllReminders, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearTimeout(initialTimeout)
    }
  }, [user, checkAllReminders])

  return {
    checkAllReminders
  }
}

