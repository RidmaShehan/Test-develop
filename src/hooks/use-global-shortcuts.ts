'use client'

import { useEffect, useCallback } from 'react'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  callback: () => void
  description?: string
}

/**
 * Hook for global keyboard shortcuts
 * 
 * Examples:
 * - Cmd/Ctrl + K: Search
 * - Cmd/Ctrl + N: New inquiry
 * - Cmd/Ctrl + Enter: Create/Submit
 */
export function useGlobalShortcut(config: ShortcutConfig) {
  const { key, ctrl = false, meta = false, shift = false, alt = false, callback } = config

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if target is an input field where we should allow typing
    const target = event.target as HTMLElement
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    
    // For Cmd/Ctrl + Enter, allow it even in input fields
    const isSubmitShortcut = (event.metaKey || event.ctrlKey) && event.key === 'Enter'
    
    // For other shortcuts, don't trigger if user is typing in an input
    if (isInputField && !isSubmitShortcut) {
      // Allow shortcuts that don't conflict with typing
      const allowedKeys = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12']
      if (!allowedKeys.includes(event.key) && !event.metaKey && !event.ctrlKey) {
        return
      }
    }

    const matches = (
      event.key.toLowerCase() === key.toLowerCase() &&
      !!event.ctrlKey === ctrl &&
      !!event.metaKey === meta &&
      !!event.shiftKey === shift &&
      !!event.altKey === alt
    )

    if (matches) {
      event.preventDefault()
      callback()
    }
  }, [key, ctrl, meta, shift, alt, callback])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook for creating cross-platform shortcuts (Cmd on Mac, Ctrl on Windows)
 */
export function useModifierKey(
  key: string,
  callback: () => void,
  options?: {
    shift?: boolean
    alt?: boolean
    description?: string
  }
) {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  useGlobalShortcut({
    key,
    ctrl: !isMac,
    meta: isMac,
    shift: options?.shift || false,
    alt: options?.alt || false,
    callback,
    description: options?.description,
  })
}

/**
 * Hook to create a new inquiry with Cmd/Ctrl + N
 */
export function useNewInquiryShortcut(callback: () => void) {
  useModifierKey('n', callback, {
    description: 'Create new inquiry',
  })
}

/**
 * Hook for Cmd/Ctrl + Enter to submit/create
 */
export function useSubmitShortcut(callback: () => void) {
  useModifierKey('Enter', callback, {
    description: 'Submit form or create item',
  })
}

