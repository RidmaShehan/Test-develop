'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AlertTriangle, GraduationCap, Building2, Users, Loader2, Trash2 } from 'lucide-react'

interface Program {
  id: string
  name: string
  levelId?: string
  level?: string
  levelRelation?: {
    id: string
    name: string
    isVisible: boolean
  }
  campus: string
  nextIntakeDate?: string
  createdAt: string
  _count?: {
    seekers: number
  }
}

interface DeleteProgramDialogProps {
  program: Program | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProgramDeleted?: () => void
}

export function DeleteProgramDialog({ program, open, onOpenChange, onProgramDeleted }: DeleteProgramDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!program) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/programs/${program.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete program')
      }

      toast.success('Program deleted successfully')
      onOpenChange(false)
      onProgramDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete program')
      console.error('Error deleting program:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!program) return null

  const seekerCount = program._count?.seekers || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-xl shadow-lg shadow-red-500/30">
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Delete Program</DialogTitle>
              <DialogDescription>This action cannot be undone</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Are you sure you want to delete this program?
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                All associated data will be permanently removed.
              </p>
            </div>
          </div>

          {/* Program Info Card */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{program.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {program.levelRelation?.name || program.level || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>{program.campus}</span>
                </div>
              </div>
            </div>
            
            {seekerCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <Users className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    <strong>{seekerCount}</strong> seeker(s) are interested in this program
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-11 order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-11 order-1 sm:order-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Program
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
