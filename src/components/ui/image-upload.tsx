'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon, Zap } from 'lucide-react'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview with value prop when it changes
  useEffect(() => {
    if (value) {
      // Ensure the URL is properly formatted
      const formattedUrl = value.startsWith('/') || value.startsWith('http') || value.startsWith('data:') 
        ? value 
        : `/${value}`
      setPreview(formattedUrl)
    } else {
      // Clear preview if value is null/empty
      setPreview(null)
      // Also clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [value])

  const compressImage = async (file: File): Promise<File> => {
    const maxSizeMB = 2 // Target size: 2MB
    const maxWidthOrHeight = 1920 // Max dimension: 1920px
    
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type,
      initialQuality: 0.8, // Start with 80% quality
    }

    try {
      const compressedFile = await imageCompression(file, options)
      
      // If still too large, compress more aggressively
      if (compressedFile.size > maxSizeMB * 1024 * 1024) {
        const aggressiveOptions = {
          ...options,
          maxSizeMB: maxSizeMB,
          initialQuality: 0.6, // Reduce to 60% quality
        }
        return await imageCompression(file, aggressiveOptions)
      }
      
      return compressedFile
    } catch (error) {
      console.error('Compression error:', error)
      throw new Error('Failed to compress image')
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsCompressing(true)

    try {
      let processedFile = file
      const originalSize = file.size
      const maxSize = 5 * 1024 * 1024 // 5MB

      // If file is larger than 5MB, compress it
      if (file.size > maxSize) {
        toast.info('Large image detected. Compressing to optimize size...')
        processedFile = await compressImage(file)
        
        const compressedSize = processedFile.size
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
        
        toast.success(`Image compressed successfully! Size reduced by ${compressionRatio}%`)
      }

      // Create preview with processed file
      const previewUrl = URL.createObjectURL(processedFile)
      setPreview(previewUrl)

      setIsCompressing(false)
      setIsUploading(true)

      // Upload to server
      const formData = new FormData()
      formData.append('file', processedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }))
        const errorMessage = error.error || 'Upload failed'
        const errorDetails = error.details ? ` ${error.details}` : ''
        const errorSuggestion = error.suggestion ? ` ${error.suggestion}` : ''
        throw new Error(`${errorMessage}${errorDetails}${errorSuggestion}`)
      }

      const result = await response.json()
      
      // Ensure URL is properly formatted (add leading / if it's a local path)
      let imageUrl = result.url
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/')) {
        imageUrl = `/${imageUrl}`
      }
      
      onChange(imageUrl)
      
      // Check if it's a local storage URL (base64)
      if (imageUrl.startsWith('data:')) {
        toast.success('Image uploaded successfully (stored locally)')
      } else if (imageUrl.startsWith('http')) {
        toast.success('Image uploaded successfully to S3')
      } else {
        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setPreview(null)
      onChange(null)
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label>Campaign Image (Optional)</Label>
      
      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Campaign preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={handleButtonClick}
        >
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload an image
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF (any size - auto-compressed)
            </p>
          </div>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {isCompressing && (
        <div className="flex items-center space-x-2 text-sm text-orange-600">
          <Zap className="h-4 w-4 animate-pulse" />
          <span>Compressing image...</span>
        </div>
      )}
      
      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Uploading...</span>
        </div>
      )}
    </div>
  )
}
