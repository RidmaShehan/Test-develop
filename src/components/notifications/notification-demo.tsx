'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotification } from '@/hooks/use-notification'

export function NotificationDemo() {
  const notify = useNotification()

  const sendTestNotifications = () => {
    // Success notification
    notify.success(
      'Meeting Scheduled Successfully',
      'Your meeting "Project Review" has been scheduled for tomorrow at 2:00 PM.',
      {
        actionUrl: '/meetings',
        actionText: 'View Meeting'
      }
    )

    // Info notification
    setTimeout(() => {
      notify.info(
        'New Message Received',
        'You have received a new message from John Doe regarding the project proposal.',
        {
          actionUrl: '/inquiries',
          actionText: 'View Message'
        }
      )
    }, 1000)

    // Warning notification
    setTimeout(() => {
      notify.warning(
        'Meeting Reminder',
        'Your meeting "Client Call" starts in 15 minutes.',
        {
          actionUrl: 'https://zoom.us/j/123456789',
          actionText: 'Join Meeting'
        }
      )
    }, 2000)

    // Error notification
    setTimeout(() => {
      notify.error(
        'Failed to Save Changes',
        'There was an error saving your changes. Please try again.',
        {
          actionUrl: '/settings',
          actionText: 'Retry'
        }
      )
    }, 3000)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notification Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click the button below to test different types of notifications.
        </p>
        <Button onClick={sendTestNotifications} className="w-full">
          Send Test Notifications
        </Button>
        <div className="text-xs text-muted-foreground">
          <p>• Success notification (immediate)</p>
          <p>• Info notification (1 second delay)</p>
          <p>• Warning notification (2 second delay)</p>
          <p>• Error notification (3 second delay)</p>
        </div>
      </CardContent>
    </Card>
  )
}
