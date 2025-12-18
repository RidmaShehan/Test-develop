'use client'

import { useState, useEffect } from 'react'
import { Loader2, Target } from 'lucide-react'

interface CampaignImageProps {
  imageUrl: string | null | undefined
  alt: string
  className?: string
  containerClassName?: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
}

export function CampaignImage({ 
  imageUrl, 
  alt, 
  className = '', 
  containerClassName = '',
  onClick,
  size = 'md'
}: CampaignImageProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true)
      setImageError(false)
    }
  }, [imageUrl])

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  if (!imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 ${containerClassName}`}>
        <Target className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
      </div>
    )
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 relative ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${containerClassName}`}
      onClick={onClick}
    >
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'} animate-spin text-gray-400`} />
        </div>
      )}
      
      {imageError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Target className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  )
}

