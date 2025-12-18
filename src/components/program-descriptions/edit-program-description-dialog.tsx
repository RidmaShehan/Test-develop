'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AdvancedRichTextEditor } from '@/components/ui/advanced-rich-text-editor'
import { ImageUpload } from '@/components/ui/image-upload'
import { Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Program {
  id: string
  name: string
  level: string | null
  campus: string
  description: string | null
  imageUrl: string | null
}

interface EditProgramDescriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: Program
  onSuccess: () => void
}

export function EditProgramDescriptionDialog({
  open,
  onOpenChange,
  program,
  onSuccess
}: EditProgramDescriptionDialogProps) {
  const [description, setDescription] = useState(program.description || '')
  const [imageUrl, setImageUrl] = useState<string | null>(program.imageUrl || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && program) {
      setDescription(program.description || '')
      // Ensure imageUrl is properly formatted
      const formattedImageUrl = program.imageUrl 
        ? (program.imageUrl.startsWith('/') || program.imageUrl.startsWith('http') || program.imageUrl.startsWith('data:')
            ? program.imageUrl 
            : `/${program.imageUrl}`)
        : ''
      setImageUrl(formattedImageUrl)
    }
  }, [open, program])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Build request body - only include fields that should be updated
      // Ensure imageUrl is properly formatted before sending
      const formattedImageUrl = imageUrl && imageUrl.trim() 
        ? (imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:')
            ? imageUrl.trim()
            : `/${imageUrl.trim()}`)
        : null
      
      const requestBody: any = {
        name: program.name,
        level: program.level || null,
        campus: program.campus,
        description: description.trim() || null,
        imageUrl: formattedImageUrl,
      }

      // Don't include levelId if it's not needed
      // Only include nextIntakeDate if it exists in the program
      
      console.log('Updating program with data:', {
        id: program.id,
        ...requestBody
      })

      const response = await fetch(`/api/programs/${program.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedProgram = await response.json()
        console.log('Program updated successfully:', updatedProgram)
        toast.success('Program description updated successfully')
        onSuccess()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update program description' }))
        console.error('Update error response:', errorData)
        toast.error(errorData.error || errorData.details || 'Failed to update program description')
      }
    } catch (error) {
      console.error('Error updating program description:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update program description')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Program Description
          </DialogTitle>
          <DialogDescription>
            Add or update the description and image for {program.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Program Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{program.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {program.level || 'N/A'} • {program.campus}
                </p>
              </div>
            </div>
          </div>

          {/* Note: Images can now be inserted directly in the editor above */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> You can insert images directly into the description editor above using the image icon in the toolbar, 
              or by dragging and dropping images. The image upload below is for a featured/cover image (optional).
            </p>
          </div>

          {/* Featured Image Upload (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Featured Image (Optional)
            </Label>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setImageUrl(url ?? '')}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Optional: Upload a featured/cover image for this program (separate from inline images in description)
            </p>
          </div>

          {/* Advanced Rich Text Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Program Description</Label>
            <AdvancedRichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Start writing... You can insert images anywhere by clicking the image icon or dragging and dropping images into the editor."
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Full-featured editor: Format text, insert images inline, add headings, quotes, links, and more. 
              Click on images to resize them.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Description
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

