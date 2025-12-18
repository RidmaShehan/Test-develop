'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SafeNotification } from '@/lib/notification-utils'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
  entityType?: 'task' | 'project' | 'deal' | 'meeting' | 'comment' | 'mention'
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationSupported, setIsNotificationSupported] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client flag and check browser support
    setIsClient(true)
    
    if (typeof window !== 'undefined') {
      setIsNotificationSupported(SafeNotification.isSupported())
      
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

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Show browser notification if permission is granted (only in browser environment)
    if (isClient && isNotificationSupported && SafeNotification.permission === 'granted') {
      const browserNotification = SafeNotification.create(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
        requireInteraction: notification.type === 'error' || notification.type === 'warning'
      })

      // Auto-close after 5 seconds unless it's an error
      if (browserNotification && notification.type !== 'error') {
        setTimeout(() => {
          browserNotification.close()
        }, 5000)
      }

      // Handle click on browser notification
      if (browserNotification) {
        browserNotification.onclick = () => {
          window.focus()
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl
          }
          browserNotification.close()
        }
      }
    }
  }, [isNotificationSupported])

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

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    isNotificationSupported
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
