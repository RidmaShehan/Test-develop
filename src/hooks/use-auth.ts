'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { safeJsonParse } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await safeJsonParse(response)
        setUser(data.user)
      } else {
        setUser(null)
        router.push('/sign-in')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      router.push('/sign-in')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/sign-in')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return { user, loading, logout, checkAuth }
}
