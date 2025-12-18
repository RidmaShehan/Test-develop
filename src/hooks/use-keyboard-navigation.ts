'use client'

import { useEffect, useCallback, RefObject } from 'react'

interface KeyboardNavigationOptions {
  formRef: RefObject<HTMLFormElement>
  onSubmit?: () => void
  enableEnterToNextField?: boolean
  enableArrowNavigation?: boolean
}

/**
 * Custom hook for keyboard navigation in forms
 * 
 * Features:
 * - Tab/Enter: Move to next field
 * - Shift + Tab: Move to previous field
 * - Arrow Up/Down: Navigate dropdowns
 * - Enter: Select dropdown option
 * - Space: Toggle checkboxes
 * - Left/Right: Navigate radio buttons
 * - Cmd/Ctrl + Enter: Submit form
 */
export function useKeyboardNavigation({
  formRef,
  onSubmit,
  enableEnterToNextField = true,
  enableArrowNavigation = true,
}: KeyboardNavigationOptions) {
  
  const getFocusableElements = useCallback(() => {
    if (!formRef.current) return []
    
    const selector = [
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')
    
    return Array.from(formRef.current.querySelectorAll(selector)) as HTMLElement[]
  }, [formRef])

  const focusNextElement = useCallback((currentElement: HTMLElement, direction: 'next' | 'prev' = 'next') => {
    const focusableElements = getFocusableElements()
    const currentIndex = focusableElements.indexOf(currentElement)
    
    if (currentIndex === -1) return
    
    let nextIndex: number
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % focusableElements.length
    } else {
      nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
    }
    
    const nextElement = focusableElements[nextIndex]
    if (nextElement) {
      nextElement.focus()
      
      // Auto-open select elements
      if (nextElement.tagName === 'SELECT') {
        const selectElement = nextElement as HTMLSelectElement
        // Trigger focus to show dropdown
        selectElement.size = Math.min(selectElement.options.length, 10)
        setTimeout(() => {
          selectElement.size = 0
        }, 100)
      }
    }
  }, [getFocusableElements])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    const tagName = target.tagName.toLowerCase()
    const inputType = (target as HTMLInputElement).type?.toLowerCase()

    // Cmd/Ctrl + Enter: Submit form
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      if (onSubmit) {
        onSubmit()
      } else if (formRef.current) {
        const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement
        if (submitButton) {
          submitButton.click()
        }
      }
      return
    }

    // Handle Enter key
    if (event.key === 'Enter') {
      // For textarea, allow default behavior (new line)
      if (tagName === 'textarea') {
        return
      }

      // For select elements, let default behavior work
      if (tagName === 'select') {
        return
      }

      // For checkboxes and radio buttons, toggle/select
      if (inputType === 'checkbox' || inputType === 'radio') {
        event.preventDefault()
        ;(target as HTMLInputElement).click()
        return
      }

      // For buttons, let default behavior work
      if (tagName === 'button') {
        return
      }

      // For other inputs, move to next field if enabled
      if (enableEnterToNextField) {
        event.preventDefault()
        focusNextElement(target, 'next')
      }
      return
    }

    // Tab key handling
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab: Previous field
        event.preventDefault()
        focusNextElement(target, 'prev')
      } else {
        // Tab: Next field
        event.preventDefault()
        focusNextElement(target, 'next')
      }
      return
    }

    // Space bar for checkboxes
    if (event.key === ' ' && inputType === 'checkbox') {
      event.preventDefault()
      ;(target as HTMLInputElement).click()
      return
    }

    // Arrow navigation for select elements
    if (enableArrowNavigation && tagName === 'select') {
      const selectElement = target as HTMLSelectElement
      
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (selectElement.selectedIndex < selectElement.options.length - 1) {
          selectElement.selectedIndex++
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        }
        return
      }
      
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (selectElement.selectedIndex > 0) {
          selectElement.selectedIndex--
          selectElement.dispatchEvent(new Event('change', { bubbles: true }))
        }
        return
      }
    }

    // Arrow navigation for radio buttons (Left/Right)
    if (inputType === 'radio') {
      const radioName = (target as HTMLInputElement).name
      const radioButtons = Array.from(
        formRef.current?.querySelectorAll(`input[type="radio"][name="${radioName}"]`) || []
      ) as HTMLInputElement[]

      const currentIndex = radioButtons.indexOf(target as HTMLInputElement)

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex = (currentIndex + 1) % radioButtons.length
        radioButtons[nextIndex].focus()
        radioButtons[nextIndex].click()
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        const prevIndex = currentIndex === 0 ? radioButtons.length - 1 : currentIndex - 1
        radioButtons[prevIndex].focus()
        radioButtons[prevIndex].click()
        return
      }
    }

    // Arrow navigation for custom dropdowns (combobox role)
    if (target.getAttribute('role') === 'combobox') {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // Let the component handle this
        return
      }
    }
  }, [formRef, onSubmit, enableEnterToNextField, enableArrowNavigation, focusNextElement])

  useEffect(() => {
    const form = formRef.current
    if (!form) return

    form.addEventListener('keydown', handleKeyDown)

    return () => {
      form.removeEventListener('keydown', handleKeyDown)
    }
  }, [formRef, handleKeyDown])

  return {
    focusNextElement,
    getFocusableElements,
  }
}

