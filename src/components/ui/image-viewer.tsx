'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  alt?: string
}

export function ImageViewer({ open, onOpenChange, imageUrl, alt = 'Image' }: ImageViewerProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (open && imageUrl) {
      setImageLoading(true)
      setImageError(false)
    }
  }, [open, imageUrl])

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl p-0 bg-black/80 border-0">
        <DialogTitle className="sr-only">
          {alt}
        </DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center min-h-[200px]">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-50 bg-black/70 hover:bg-black/90 text-white rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="text-sm text-white/80">Loading image...</span>
              </div>
            </div>
          )}
          
          {imageError ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-white">
              <div className="text-lg font-medium">Failed to load image</div>
              <div className="text-sm text-white/80">Please try again later</div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={alt}
              className={`max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={(e) => e.stopPropagation()}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

