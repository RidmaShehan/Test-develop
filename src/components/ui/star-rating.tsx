'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  maxRating = 5, 
  size = 'md',
  readonly = false,
  className 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const handleClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= rating
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(starValue)}
            disabled={readonly}
            className={cn(
              'transition-colors duration-150',
              !readonly && 'hover:scale-110',
              readonly ? 'cursor-default' : 'cursor-pointer'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-200'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

interface StarRatingDisplayProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StarRatingDisplay({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  className 
}: StarRatingDisplayProps) {
  return (
    <StarRating
      rating={rating}
      maxRating={maxRating}
      size={size}
      readonly={true}
      className={className}
    />
  )
}
