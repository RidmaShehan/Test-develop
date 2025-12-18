'use client'

import { useNotifications } from '@/contexts/notification-context'
import { useEffect, useRef } from 'react'

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

export function useMeetingReminderService() {
  const { addNotification } = useNotifications()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const checkedMeetingsRef = useRef<Set<string>>(new Set())

  const checkUpcomingMeetings = async () => {
    try {
      const response = await fetch('/api/meetings')
      if (!response.ok) return

      const meetings: Meeting[] = await response.json()
      const now = new Date()
      const reminderTimes = [5, 15, 30, 60] // minutes before meeting

      meetings.forEach(meeting => {
        const meetingStart = new Date(meeting.startTime)
        const timeUntilMeeting = meetingStart.getTime() - now.getTime()
        const minutesUntilMeeting = Math.floor(timeUntilMeeting / (1000 * 60))

        // Check if we should send a reminder
        reminderTimes.forEach(reminderMinutes => {
          if (minutesUntilMeeting === reminderMinutes && minutesUntilMeeting > 0) {
            const reminderKey = `${meeting.id}-${reminderMinutes}`
            
            // Only send reminder once per meeting per time interval
            if (!checkedMeetingsRef.current.has(reminderKey)) {
              checkedMeetingsRef.current.add(reminderKey)
              
              const meetingTypeText = meeting.meetingType ? 
                ` (${meeting.meetingType.replace('_', ' ')})` : ''
              
              addNotification({
                title: `Meeting Reminder: ${meeting.title}`,
                message: `Your meeting "${meeting.title}"${meetingTypeText} starts in ${reminderMinutes} minutes.`,
                type: reminderMinutes <= 15 ? 'warning' : 'info',
                actionUrl: meeting.meetingLink || '/meetings',
                actionText: meeting.meetingLink ? 'Join Meeting' : 'View Meeting'
              })

              // Clean up the reminder key after the meeting time has passed
              setTimeout(() => {
                checkedMeetingsRef.current.delete(reminderKey)
              }, (reminderMinutes + 5) * 60 * 1000) // 5 minutes after meeting start
            }
          }
        })
      })
    } catch (error) {
      console.error('Error checking meeting reminders:', error)
    }
  }

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    // Check for reminders every minute
    intervalRef.current = setInterval(checkUpcomingMeetings, 60000)
    
    // Initial check
    checkUpcomingMeetings()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [addNotification])

  return {
    checkUpcomingMeetings
  }
}
