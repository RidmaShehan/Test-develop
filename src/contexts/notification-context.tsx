'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SafeNotification } from '@/lib/notification-utils'
import { PushNotificationClient } from '@/lib/push-notification-client'
<<<<<<< HEAD
import { useNotificationStream, type StreamNotification } from '@/hooks/use-notification-stream'
=======
import { realtimeService } from '@/lib/realtime'
import { useAuth } from '@/hooks/use-auth'
>>>>>>> dd36b09c5ae205bf3620780153084dca831d8f9f

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
  entityType?: 'task' | 'project' | 'deal' | 'meeting' | 'comment' | 'mention' | 'inquiry' | 'note'
  entityId?: string
  fromUser?: {
    id: string
    name: string
    email: string
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  requestNotificationPermission: () => Promise<boolean>
  isNotificationSupported: boolean
  isPushSupported: boolean
  subscribeToPush: () => Promise<boolean>
  unsubscribeFromPush: () => Promise<boolean>
  isPushSubscribed: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationSupported, setIsNotificationSupported] = useState(false)

  // Wire in SSE-based real-time notifications
  useNotificationStream(useCallback((incoming: StreamNotification[]) => {
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id))
      const newOnes = incoming
        .filter((n) => !existingIds.has(n.id))
        .map((n) => ({
          id: n.id,
          title: n.title || 'Notification',
          message: n.message || '',
          type: (n.type as Notification['type']) || 'info',
          timestamp: new Date(n.createdAt),
          read: n.read ?? false,
        }))
      return newOnes.length > 0 ? [...newOnes, ...prev] : prev
    })
  }, []))
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client flag and check browser support
    setIsClient(true)
    
    if (typeof window !== 'undefined') {
      setIsNotificationSupported(SafeNotification.isSupported())
      setIsPushSupported(PushNotificationClient.isSupported())
      
      // Check if already subscribed to push
      PushNotificationClient.getSubscription().then((sub) => {
        setIsPushSubscribed(!!sub)
      })
      
      // Register service worker for push notifications
      if (PushNotificationClient.isSupported()) {
        PushNotificationClient.registerServiceWorker().catch(console.error)
      }
      
      // Load notifications from localStorage
      const savedNotifications = localStorage.getItem('notifications')
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications)
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })))
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications])


  const unreadCount = notifications.filter(n => !n.read).length

  // Favicon badge is updated by NotificationBadgeSync from API count when on dashboard

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Persist to API-backed notifications so it survives refresh/login/device.
    // Fire-and-forget to keep UI snappy; failures should not block local UX.
    if (typeof window !== 'undefined') {
      fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          entityType: notification.entityType,
          postId: undefined,
        }),
      }).catch((error) => {
        console.error('Failed to persist notification:', error)
      })
    }

    // Show browser notification when side panel shows notification (only in browser environment)
    if (isClient && isNotificationSupported) {
      // Always try to show browser notification when notification appears
      const showBrowserNotification = async () => {
        const currentPermission = SafeNotification.permission
        
        // If permission is granted, show notification immediately
        if (currentPermission === 'granted') {
          const browserNotification = SafeNotification.create(notification.title, {
            body: notification.message,
            icon: '/fav.png',
            badge: '/fav.png',
            tag: newNotification.id,
            requireInteraction: notification.type === 'error' || notification.type === 'warning',
            data: {
              url: notification.actionUrl,
              notificationId: newNotification.id
            }
          })

          // Auto-close after 5 seconds unless it's an error or warning
          if (browserNotification && notification.type !== 'error' && notification.type !== 'warning') {
            setTimeout(() => {
              try {
                browserNotification.close()
              } catch (e) {
                // Ignore errors when closing
              }
            }, 5000)
          }

          // Handle click on browser notification
          if (browserNotification && notification.actionUrl) {
            browserNotification.onclick = (event) => {
              event.preventDefault()
              window.focus()
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl
              }
              try {
                browserNotification.close()
              } catch (e) {
                // Ignore errors when closing
              }
            }
          }
        } else if (currentPermission === 'default') {
          // Request permission and show notification if granted
          try {
            const permission = await SafeNotification.requestPermission()
            if (permission === 'granted') {
              // Show notification after permission is granted
              const browserNotification = SafeNotification.create(notification.title, {
                body: notification.message,
                icon: '/fav.png',
                badge: '/fav.png',
                tag: newNotification.id,
                requireInteraction: notification.type === 'error' || notification.type === 'warning',
                data: {
                  url: notification.actionUrl,
                  notificationId: newNotification.id
                }
              })

              // Auto-close after 5 seconds unless it's an error or warning
              if (browserNotification && notification.type !== 'error' && notification.type !== 'warning') {
                setTimeout(() => {
                  try {
                    browserNotification.close()
                  } catch (e) {
                    // Ignore errors when closing
                  }
                }, 5000)
              }

              // Handle click on browser notification
              if (browserNotification && notification.actionUrl) {
                browserNotification.onclick = (event) => {
                  event.preventDefault()
                  window.focus()
                  if (notification.actionUrl) {
                    window.location.href = notification.actionUrl
                  }
                  try {
                    browserNotification.close()
                  } catch (e) {
                    // Ignore errors when closing
                  }
                }
              }
            }
          } catch (e) {
            // Permission denied or error - ignore
            console.warn('Could not show browser notification:', e)
          }
        }
      }

      // Show browser notification (async, don't block)
      showBrowserNotification().catch(() => {
        // Ignore errors
      })
    }
  }, [isClient, isNotificationSupported])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isNotificationSupported) {
      return false
    }

    const currentPermission = SafeNotification.permission
    if (currentPermission === 'granted') {
      return true
    }

    if (currentPermission === 'denied') {
      return false
    }

    const permission = await SafeNotification.requestPermission()
    return permission === 'granted'
  }, [isClient, isNotificationSupported])

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isPushSupported) {
      return false
    }

    try {
      const success = await PushNotificationClient.subscribeAndSave()
      if (success) {
        setIsPushSubscribed(true)
      }
      return success
    } catch (error) {
      console.error('Error subscribing to push:', error)
      return false
    }
  }, [isClient, isPushSupported])

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!isClient) {
      return false
    }

    try {
      const success = await PushNotificationClient.unsubscribeAndRemove()
      if (success) {
        setIsPushSubscribed(false)
      }
      return success
    } catch (error) {
      console.error('Error unsubscribing from push:', error)
      return false
    }
  }, [isClient])

  // Realtime subscriptions with Supabase
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return

    console.log('Setting up realtime subscriptions for user:', user.id)

    // Subscribe to new inquiries
        realtimeService.subscribeToInquiries(user.id, (newInquiry: any) => {
      addNotification({
        title: 'New Inquiry',
        message: `New inquiry from ${newInquiry.fullName || 'a lead'}`,
        type: 'info',
        entityType: 'inquiry',
        entityId: newInquiry.id,
        actionUrl: `/inquiries`,
        actionText: 'View Inquiry'
      })
    })

    // Subscribe to task updates
    realtimeService.subscribeToTasks(user.id, (task: any) => {
      if (task) {
        addNotification({
          title: task.status === 'COMPLETED' ? 'Task Completed' : 'Task Updated',
          message: task.title || 'A task has been updated',
          type: task.status === 'COMPLETED' ? 'success' : 'info',
          entityType: 'task',
          entityId: task.id,
          actionUrl: `/tasks`,
          actionText: 'View Tasks'
        })
      }
    })

    return () => {
      realtimeService.unsubscribeAll()
    }
  }, [user?.id, addNotification])

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    isNotificationSupported,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
    isPushSubscribed
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
