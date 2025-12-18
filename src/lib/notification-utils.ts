'use client'

// Safe wrapper for Notification API to prevent SSR errors
export class SafeNotification {
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window
  }

  static get permission(): NotificationPermission | null {
    if (!this.isSupported()) return null
    return Notification.permission
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied'
    return await Notification.requestPermission()
  }

  static create(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isSupported()) return null
    return new Notification(title, options)
  }
}
