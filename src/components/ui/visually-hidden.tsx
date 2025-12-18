'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements
}

export function VisuallyHidden({ 
  as = 'span', 
  className,
  ...props 
}: VisuallyHiddenProps) {
  const Component = as as React.ElementType
  
  return (
    <Component
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        'clip-path-[inset(50%)]',
        className
      )}
      style={{
        clipPath: 'inset(50%)',
        clip: 'rect(0 0 0 0)',
      }}
      {...props}
    />
  )
}

