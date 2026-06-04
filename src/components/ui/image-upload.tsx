'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Image as ImageIcon, Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  /**
   * upload: existing behavior (upload via /api/upload)
   * base64: keep image inline as data URL (no file-system/S3 dependency)
   */
  storageMode?: 'upload' | 'base64'
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  storageMode = 'upload',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isEncoding, setIsEncoding] = useState(false)
  const [isDecoding, setIsDecoding] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
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
      setPreviewError(null)
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

  const decodePreview = async (url: string): Promise<void> => {
    setIsDecoding(true)
    setPreviewError(null)
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to decode image preview'))
        img.src = url
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decode image preview'
      setPreviewError(message)
      toast.error(message)
      throw error
    } finally {
      setIsDecoding(false)
    }
  }

  const fileToDataUrl = async (file: File): Promise<string> => {
    setIsEncoding(true)
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Failed to encode image as base64'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to encode image as base64'))
        reader.readAsDataURL(file)
      })
    } finally {
      setIsEncoding(false)
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

      setIsCompressing(false)

      if (storageMode === 'base64') {
        const dataUrl = await fileToDataUrl(processedFile)
        await decodePreview(dataUrl)
        setPreview(dataUrl)
        onChange(dataUrl)
        toast.success('Image encoded in base64 successfully')
      } else {
        // Create preview with processed file while uploading
        const previewUrl = URL.createObjectURL(processedFile)
        setPreview(previewUrl)
        await decodePreview(previewUrl)

        setIsUploading(true)
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

        let imageUrl = result.url
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/')) {
          imageUrl = `/${imageUrl}`
        }

        await decodePreview(imageUrl)
        setPreview(imageUrl)
        onChange(imageUrl)
        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Image processing failed')
      setPreview(null)
      onChange(null)
    } finally {
      setIsCompressing(false)
      setIsUploading(false)
      setIsEncoding(false)
      setIsDecoding(false)
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
      <Label>Image (Optional)</Label>
      
      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img src={preview} alt="Image preview" className="w-full h-full object-cover" />
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

      {isEncoding && (
        <div className="flex items-center space-x-2 text-sm text-purple-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Encoding image to base64...</span>
        </div>
      )}

      {isDecoding && (
        <div className="flex items-center space-x-2 text-sm text-indigo-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Decoding image preview...</span>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Uploading...</span>
        </div>
      )}

      {previewError && (
        <div className="text-xs text-red-600">{previewError}</div>
      )}
    </div>
  )
}
