'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth as useAuthContext } from '@/contexts/auth-context'

export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  permissions?: string[]
  roles?: { id: string; name: string }[]
}

const ACTIVITY_UPDATE_THROTTLE_MS = 60_000
let lastGlobalActivityUpdate = 0
let activityUpdateInFlight = false
let globalFetchPatched = false
let originalWindowFetch: typeof window.fetch | null = null

async function postSessionActivity() {
  if (typeof window === 'undefined') return

  const now = Date.now()
  if (activityUpdateInFlight || now - lastGlobalActivityUpdate < ACTIVITY_UPDATE_THROTTLE_MS) {
    return
  }

  activityUpdateInFlight = true
  try {
    // Use original fetch if patched to avoid layered wrappers.
    const fetchImpl = originalWindowFetch ?? window.fetch
    await fetchImpl('/api/auth/session-activity', { method: 'POST' })
    lastGlobalActivityUpdate = now
  } catch (error) {
    console.error('Failed to update session activity:', error)
  } finally {
    activityUpdateInFlight = false
  }
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

// Check if session is expired (1 hour inactivity)
function isSessionExpired(): boolean {
  const activityCookie = getCookie('session-activity')
  if (!activityCookie) return true
  
  try {
    const expiresAt = parseInt(activityCookie, 10)
    if (isNaN(expiresAt)) return true
    
    const now = Date.now()
    return now >= expiresAt
  } catch {
    return true
  }
}

export function useAuth() {
  const context = useAuthContext()
  const router = useRouter()
  const activityCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Global activity tracking (shared across all instances)
  const updateActivity = useCallback(async () => {
    await postSessionActivity()
  }, [])

  // Check for session expiry
  const checkSessionExpiry = useCallback(() => {
    if (isSessionExpired()) {
      console.log('Session expired due to inactivity (1 hour)')
      router.push('/sign-in')
      if (activityCheckInterval.current) clearInterval(activityCheckInterval.current)
    }
  }, [router])

  // Patch fetch once globally to track activity
  useEffect(() => {
    if (typeof window === 'undefined' || globalFetchPatched) return

    originalWindowFetch = window.fetch
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const result = await (originalWindowFetch as typeof fetch)(...args)

      const url = args[0]
      if (typeof url === 'string' && url.startsWith('/api/') && !url.startsWith('/api/auth/')) {
        void postSessionActivity()
      }

      return result
    }

    globalFetchPatched = true
  }, [])

  // Session expiry checker (only if not using context)
  useEffect(() => {
    if (context) return

    activityCheckInterval.current = setInterval(checkSessionExpiry, 30000)
    return () => {
      if (activityCheckInterval.current) {
        clearInterval(activityCheckInterval.current)
      }
    }
  }, [checkSessionExpiry, context])

  const logout = async () => {
    try {
      if (context?.logout) {
        await context.logout()
      } else {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/sign-in')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return { 
    user: context?.user ?? null,
    loading: context?.loading ?? false,
    logout,
    checkAuth: context?.refreshUser || (() => {}),
    refreshUser: context?.refreshUser
  }
}
