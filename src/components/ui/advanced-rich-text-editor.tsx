'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, 
  Undo, Redo, Image as ImageIcon, Link, Heading1, Heading2, Heading3, Quote, Code
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'

interface AdvancedRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AdvancedRichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start writing...', 
  className,
  disabled = false 
}: AdvancedRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState<Range | null>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const saveSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setCursorPosition(selection.getRangeAt(0).cloneRange())
    }
  }, [])

  const restoreSelection = useCallback(() => {
    if (cursorPosition && editorRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(cursorPosition)
      }
    }
  }, [cursorPosition])

  const execCommand = (command: string, value?: string) => {
    saveSelection()
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    restoreSelection()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault()
    const items = e.clipboardData.items
    
    // Check if image is being pasted
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          await insertImageAtCursor(file)
          return
        }
      }
    }
    
    // Otherwise paste as text
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    updateContent()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await insertImageAtCursor(files[0])
    }
  }

  const insertImageAtCursor = async (file: File) => {
    if (!editorRef.current) return

    setIsUploading(true)
    try {
      // Compress image
      const maxSizeMB = 2
      const maxWidthOrHeight = 1920
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.8,
      }

      let processedFile = file
      if (file.size > maxSizeMB * 1024 * 1024) {
        processedFile = await imageCompression(file, options)
      }

      // Upload image
      const formData = new FormData()
      formData.append('file', processedFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      const imageUrl = result.url

      // Insert image at cursor position
      saveSelection()
      const img = document.createElement('img')
      img.src = imageUrl
      img.className = 'max-w-full h-auto rounded-lg my-4 cursor-pointer inline-image border border-gray-200 dark:border-gray-700'
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      img.style.display = 'block'
      img.style.margin = '1rem auto'
      img.contentEditable = 'false'
      img.draggable = false
      
      // Add hover effect
      img.onmouseenter = () => {
        img.style.opacity = '0.9'
        img.style.transition = 'opacity 0.2s'
      }
      img.onmouseleave = () => {
        img.style.opacity = '1'
      }
      
      // Make image resizable and deletable
      img.onclick = (e) => {
        e.stopPropagation()
        const action = prompt('Image options:\n1. Enter width in px to resize\n2. Type "delete" to remove\n3. Press Cancel to do nothing', '')
        if (action === 'delete' || action === 'Delete') {
          img.remove()
          updateContent()
        } else if (action && action !== '') {
          const width = parseInt(action)
          if (!isNaN(width) && width > 0) {
            img.style.width = width + 'px'
            img.style.maxWidth = 'none'
            updateContent()
          }
        }
      }

      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        editorRef.current.appendChild(img)
        // Add a paragraph after image
        const p = document.createElement('p')
        p.innerHTML = '<br>'
        editorRef.current.appendChild(p)
      }

      updateContent()
      toast.success('Image inserted successfully')
    } catch (error) {
      console.error('Error inserting image:', error)
      toast.error('Failed to insert image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await insertImageAtCursor(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const insertHeading = (level: number) => {
    saveSelection()
    const tag = `h${level}`
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      if (selectedText) {
        const heading = document.createElement(tag)
        heading.textContent = selectedText
        range.deleteContents()
        range.insertNode(heading)
        range.setStartAfter(heading)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Insert empty heading
        const heading = document.createElement(tag)
        heading.innerHTML = '<br>'
        range.insertNode(heading)
        range.setStart(heading, 0)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
    updateContent()
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertBlockquote = () => {
    saveSelection()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const blockquote = document.createElement('blockquote')
      const selectedText = range.toString()
      
      if (selectedText) {
        blockquote.textContent = selectedText
        range.deleteContents()
        range.insertNode(blockquote)
      } else {
        blockquote.innerHTML = '<br>'
        range.insertNode(blockquote)
      }
      
      range.setStart(blockquote, 0)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    updateContent()
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', label: 'Bold', onClick: () => execCommand('bold') },
    { icon: Italic, command: 'italic', label: 'Italic', onClick: () => execCommand('italic') },
    { icon: Underline, command: 'underline', label: 'Underline', onClick: () => execCommand('underline') },
    { separator: true },
    { icon: Heading1, label: 'Heading 1', onClick: () => insertHeading(1) },
    { icon: Heading2, label: 'Heading 2', onClick: () => insertHeading(2) },
    { icon: Heading3, label: 'Heading 3', onClick: () => insertHeading(3) },
    { separator: true },
    { icon: List, command: 'insertUnorderedList', label: 'Bullet List', onClick: () => execCommand('insertUnorderedList') },
    { icon: ListOrdered, command: 'insertOrderedList', label: 'Numbered List', onClick: () => execCommand('insertOrderedList') },
    { icon: Quote, label: 'Quote', onClick: insertBlockquote },
    { icon: Code, label: 'Code', onClick: () => execCommand('formatBlock', 'pre') },
    { separator: true },
    { icon: AlignLeft, command: 'justifyLeft', label: 'Align Left', onClick: () => execCommand('justifyLeft') },
    { icon: AlignCenter, command: 'justifyCenter', label: 'Align Center', onClick: () => execCommand('justifyCenter') },
    { icon: AlignRight, command: 'justifyRight', label: 'Align Right', onClick: () => execCommand('justifyRight') },
    { separator: true },
    { icon: Link, label: 'Link', onClick: insertLink },
    { icon: ImageIcon, label: 'Insert Image', onClick: () => fileInputRef.current?.click() },
    { separator: true },
    { icon: Undo, command: 'undo', label: 'Undo', onClick: () => execCommand('undo') },
    { icon: Redo, command: 'redo', label: 'Redo', onClick: () => execCommand('redo') },
  ]

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white dark:bg-gray-900', className, isFocused && 'ring-2 ring-blue-500 ring-offset-2')}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800 flex-wrap sticky top-0 z-10">
        {toolbarButtons.map((button, index) => {
          if ('separator' in button) {
            return <div key={`sep-${index}`} className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          }
          const Icon = button.icon
          return (
            <Button
              key={button.label}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={button.onClick}
              disabled={disabled || isUploading}
              title={button.label}
              aria-label={button.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        })}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Editor */}
      <div className="relative">
        {isUploading && (
          <div className="absolute inset-0 bg-black/5 dark:bg-white/5 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Uploading image...</span>
            </div>
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={updateContent}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          className={cn(
            'min-h-[400px] p-4 sm:p-6 outline-none',
            'prose prose-sm max-w-none dark:prose-invert',
            '[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2',
            '[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2',
            '[&_p]:my-2 [&_p]:leading-relaxed',
            '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4',
            '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3',
            '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4',
            '[&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded [&_pre]:my-4 [&_pre]:overflow-x-auto',
            '[&_strong]:font-bold [&_em]:italic [&_u]:underline',
            '[&_.inline-image]:max-w-full [&_.inline-image]:h-auto [&_.inline-image]:rounded-lg [&_.inline-image]:my-4 [&_.inline-image]:cursor-pointer [&_.inline-image]:border [&_.inline-image]:border-gray-200 [&_.inline-image]:dark:border-gray-700',
            '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:block [&_img]:mx-auto [&_img]:border [&_img]:border-gray-200 [&_img]:dark:border-gray-700',
            '[&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
        {!value && !isFocused && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-gray-400 pointer-events-none text-sm">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
