'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface StatusBarProps {
  value?: number
  onChange?: (value: number) => void
  maxValue?: number
  className?: string
}

export function StatusBar({ 
  value = 0, 
  onChange, 
  maxValue = 10,
  className 
}: StatusBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleClick = (index: number) => {
    if (onChange) {
      onChange(index + 1)
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  const getBarColor = (index: number) => {
    const isActive = index < value
    const isHovered = hoveredIndex !== null && index <= hoveredIndex
    
    if (isActive) {
      // Color progression: red (1) → yellow (5) → green (10)
      const progress = (index + 1) / maxValue // 0.1 to 1.0
      
      if (progress <= 0.5) {
        // Red to Yellow (0.1 to 0.5)
        const localProgress = progress * 2 // 0.2 to 1.0
        const red = 255
        const green = Math.floor(255 * localProgress)
        const blue = 0
        return `rgba(${red}, ${green}, ${blue}, 0.8)`
      } else {
        // Yellow to Green (0.5 to 1.0)
        const localProgress = (progress - 0.5) * 2 // 0.0 to 1.0
        const red = Math.floor(255 * (1 - localProgress))
        const green = 255
        const blue = 0
        return `rgba(${red}, ${green}, ${blue}, 0.8)`
      }
    }
    
    if (isHovered) {
      return 'rgba(156, 163, 175, 0.4)' // Light gray for hover
    }
    
    return 'rgba(156, 163, 175, 0.3)' // Light gray for inactive
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxValue }, (_, index) => (
          <button
            key={index}
            type="button"
            className={cn(
              "h-8 flex-1 border border-gray-300 transition-all duration-200 hover:scale-y-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
              index === 0 ? "rounded-l-md" : "",
              index === maxValue - 1 ? "rounded-r-md" : "",
              index < value ? "border-red-500" : "border-gray-300"
            )}
            style={{
              backgroundColor: getBarColor(index)
            }}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            aria-label={`Select status ${index + 1}`}
          >
            <span className="text-xs font-medium text-gray-700 flex items-center justify-center h-full">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>1</span>
        <span className="text-sm font-medium text-gray-700">
          {value > 0 ? `Selected: ${value}/${maxValue}` : 'Click to select status'}
        </span>
        <span>{maxValue}</span>
      </div>
    </div>
  )
}
