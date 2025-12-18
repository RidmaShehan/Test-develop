import { useNotifications } from '@/contexts/notification-context'

export function useNotification() {
  const { addNotification } = useNotifications()

  const notify = {
    success: (title: string, message: string, options?: { actionUrl?: string; actionText?: string }) => {
      addNotification({
        title,
        message,
        type: 'success',
        ...options
      })
    },

    error: (title: string, message: string, options?: { actionUrl?: string; actionText?: string }) => {
      addNotification({
        title,
        message,
        type: 'error',
        ...options
      })
    },

    warning: (title: string, message: string, options?: { actionUrl?: string; actionText?: string }) => {
      addNotification({
        title,
        message,
        type: 'warning',
        ...options
      })
    },

    info: (title: string, message: string, options?: { actionUrl?: string; actionText?: string }) => {
      addNotification({
        title,
        message,
        type: 'info',
        ...options
      })
    }
  }

  return notify
}
