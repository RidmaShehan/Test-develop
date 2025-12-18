'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, GraduationCap } from 'lucide-react'

interface Level {
  id: string
  name: string
  description: string | null
  isVisible: boolean
  sortOrder: number
  createdAt: string
  _count: {
    programs: number
  }
}

interface DeleteLevelDialogProps {
  level: Level | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLevelDeleted?: () => void
}

export function DeleteLevelDialog({ level, open, onOpenChange, onLevelDeleted }: DeleteLevelDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!level) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/levels/${level.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete level')
      }

      toast.success('Level deleted successfully')
      onOpenChange(false)
      onLevelDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete level')
      console.error('Error deleting level:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!level) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Level
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this level? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">{level.name}</h4>
                <p className="text-sm text-gray-600">
                  {level.description || 'No description provided'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${level.isVisible ? 'text-green-600' : 'text-red-600'}`}>
                  {level.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sort Order:</span>
                <span className="font-medium">{level.sortOrder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Programs:</span>
                <span className="font-medium">{level._count.programs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(level.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {level._count.programs > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  🚨 Cannot delete this level because it has {level._count.programs} program(s) associated with it. 
                  Please reassign or delete the programs first.
                </p>
              </div>
            )}

            {level._count.programs === 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ This level has no associated programs and can be safely deleted.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || level._count.programs > 0}
          >
            {isDeleting ? 'Deleting...' : 'Delete Level'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
