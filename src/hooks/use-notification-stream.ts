'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface StreamNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  [key: string]: unknown
}

interface UseNotificationStreamResult {
  connected: boolean
  lastEvent: StreamNotification[] | null
}

export function useNotificationStream(
  onNotifications?: (notifications: StreamNotification[]) => void
): UseNotificationStreamResult {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<StreamNotification[] | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelay = useRef(1000)

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const es = new EventSource('/api/notifications/stream')
    esRef.current = es

    es.onopen = () => {
      setConnected(true)
      reconnectDelay.current = 1000
    }

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'notifications' && Array.isArray(data.payload)) {
          setLastEvent(data.payload)
          onNotifications?.(data.payload)
        }
      } catch {}
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      esRef.current = null

      // Exponential backoff reconnect (max 30s)
      const delay = Math.min(reconnectDelay.current, 30000)
      reconnectDelay.current = Math.min(delay * 2, 30000)
      reconnectTimerRef.current = setTimeout(connect, delay)
    }
  }, [onNotifications])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      esRef.current?.close()
      esRef.current = null
    }
  }, [connect])

  return { connected, lastEvent }
}
