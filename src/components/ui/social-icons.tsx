'use client'

import { cn } from '@/lib/utils'

interface SocialIconProps {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'newspaper' | 'tv' | 'radio' | 'web' | 'exhibition' | 'friend' | 'recommended'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SocialIcon({ platform, size = 'md', className }: SocialIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const getIconContent = () => {
    switch (platform) {
      case 'facebook':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        )
      case 'tiktok':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        )
      case 'youtube':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )
      case 'newspaper':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm2 0v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
          </svg>
        )
      case 'tv':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5l-1 1v1h8v-1l-1-1h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H3V5h18v10z"/>
          </svg>
        )
      case 'radio':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        )
      case 'web':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        )
      case 'exhibition':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
      case 'friend':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5l-1-1.5c-.47-.62-1.21-.99-2.01-.99h-1.54c-.8 0-1.54.37-2.01.99L7 10.5l-1-1.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L-2 10.5v7h2v6h4v-6h2v6h4v-6h2v6h4z"/>
          </svg>
        )
      case 'recommended':
        return (
          <svg
            className={cn(sizeClasses[size], className)}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 2.5L9.5 8.5 12 10l2.5-1.5L12 4.5z"/>
          </svg>
        )
      default:
        return null
    }
  }

  return getIconContent()
}

interface SocialIconButtonProps {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'newspaper' | 'tv' | 'radio' | 'web' | 'exhibition' | 'friend' | 'recommended'
  onClick?: () => void
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SocialIconButton({ 
  platform, 
  onClick, 
  selected = false, 
  size = 'md',
  className 
}: SocialIconButtonProps) {
  const getPlatformColors = () => {
    switch (platform) {
      case 'facebook':
        return selected 
          ? 'bg-blue-600 text-white border-blue-600' 
          : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
      case 'instagram':
        return selected 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent' 
          : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 border-purple-200 hover:from-purple-100 hover:to-pink-100'
      case 'tiktok':
        return selected 
          ? 'bg-black text-white border-black' 
          : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
      case 'youtube':
        return selected 
          ? 'bg-red-600 text-white border-red-600' 
          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
      case 'newspaper':
        return selected 
          ? 'bg-gray-600 text-white border-gray-600' 
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
      case 'tv':
        return selected 
          ? 'bg-purple-600 text-white border-purple-600' 
          : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
      case 'radio':
        return selected 
          ? 'bg-amber-600 text-white border-amber-600' 
          : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
      case 'web':
        return selected 
          ? 'bg-green-600 text-white border-green-600' 
          : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
      case 'exhibition':
        return selected 
          ? 'bg-orange-600 text-white border-orange-600' 
          : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
      case 'friend':
        return selected 
          ? 'bg-lime-600 text-white border-lime-600' 
          : 'bg-lime-50 text-lime-600 border-lime-200 hover:bg-lime-100'
      case 'recommended':
        return selected 
          ? 'bg-cyan-600 text-white border-cyan-600' 
          : 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getPlatformName = () => {
    switch (platform) {
      case 'facebook':
        return 'Facebook'
      case 'instagram':
        return 'Instagram'
      case 'tiktok':
        return 'TikTok'
      case 'youtube':
        return 'YouTube'
      case 'newspaper':
        return 'Newspaper'
      case 'tv':
        return 'TV Ads'
      case 'radio':
        return 'Radio'
      case 'web':
        return 'Web Ads'
      case 'exhibition':
        return 'Exhibition'
      case 'friend':
        return 'Friend Said'
      case 'recommended':
        return 'Recommended'
      default:
        return platform
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2',
        getPlatformColors(),
        className
      )}
    >
      <SocialIcon platform={platform} size={size} />
      <span className="text-xs font-medium mt-1">{getPlatformName()}</span>
    </button>
  )
}
