import { supabase } from './supabase'
import { toast } from 'sonner'
import type { RealtimePayload } from './supabase'

export class RealtimeService {
  private channels: any[] = [] // TODO: Type as SupabaseChannel when available
  private callbacks: Map<string, (payload: RealtimePayload) => void> = new Map()

  // Subscribe to new inquiries
  subscribeToInquiries(userId: string, onNewInquiry: (inquiry: any) => void) { // TODO: Type Inquiry properly
    if (!supabase) {
      console.warn('Supabase not configured - realtime features disabled')
      return
    }

    const channel = supabase
      .channel(`inquiries:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'seekers',
          filter: `createdById=eq.${userId}`,
        },
        (payload: RealtimePayload) => {
          console.debug('New inquiry received:', payload)
          onNewInquiry(payload.new)
          toast.success('New inquiry received!', {
            description: 'Check the inquiries list',
            action: {
              label: 'View',
              onClick: () => window.location.href = '/inquiries',
            },
          })
        }
      )
      .subscribe()

    this.channels.push(channel)
    return channel
  }

  // Subscribe to task updates
  subscribeToTasks(userId: string, onTaskUpdate: (task: any) => void) { // TODO: Type Task properly
    if (!supabase) {
      console.warn('Supabase not configured - realtime features disabled')
      return
    }

    const channel = supabase
      .channel(`tasks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `assignedToId=eq.${userId}`,
        },
        (payload: RealtimePayload) => {
          console.debug('Task update received:', payload)
          onTaskUpdate(payload.new || payload.old)

          if (payload.eventType === 'INSERT') {
            toast.info('New task assigned to you')
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Task updated')
          }
        }
      )
      .subscribe()

    this.channels.push(channel)
    return channel
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, onNotification: (notification: any) => void) { // TODO: Type Notification properly
    if (!supabase) {
      console.warn('Supabase not configured - realtime features disabled')
      return
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`,
        },
        (payload: RealtimePayload) => {
          console.debug('New notification received:', payload)
          onNotification(payload.new)
        }
      )
      .subscribe()

    this.channels.push(channel)
    return channel
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      if (channel) {
        supabase?.removeChannel(channel)
      }
    })
    this.channels = []
    this.callbacks.clear()
  }
}

export const realtimeService = new RealtimeService()