'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { GraduationCap, Building2, Calendar, BookOpen, Loader2, Users, Edit } from 'lucide-react'

const programSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  level: z.string().min(1, 'Level is required'),
  campus: z.string().min(1, 'Campus is required'),
  nextIntakeDate: z.string().optional(),
})

type ProgramFormData = z.infer<typeof programSchema>

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

interface EditProgramDialogProps {
  program: Program | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProgramUpdated?: () => void
}

export function EditProgramDialog({ program, open, onOpenChange, onProgramUpdated }: EditProgramDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([])
  
  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
  })

  useEffect(() => {
    if (open) {
      fetchLevels()
      if (program) {
        form.reset({
          name: program.name,
          level: program.levelRelation?.name || program.level || '',
          campus: program.campus,
          nextIntakeDate: program.nextIntakeDate ? new Date(program.nextIntakeDate).toISOString().split('T')[0] : '',
        })
      }
    }
  }, [open, program, form])

  const fetchLevels = async () => {
    try {
      const response = await fetch('/api/levels')
      if (response.ok) {
        const data = await response.json()
        setLevels(data)
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
    }
  }

  const onSubmit = async (data: ProgramFormData) => {
    if (!program) return
    
    setIsLoading(true)
    try {
      const selectedLevel = levels.find(level => level.name === data.level)
      
      const response = await fetch(`/api/programs/${program.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          nextIntakeDate: data.nextIntakeDate ? new Date(data.nextIntakeDate).toISOString() : null,
          levelId: selectedLevel?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update program')
      }

      toast.success('Program updated successfully')
      form.reset()
      onOpenChange(false)
      onProgramUpdated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update program')
      console.error('Error updating program:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!program) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
              <Edit className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Edit Program</DialogTitle>
              <DialogDescription>Update program details</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Program Info Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{program.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {program.levelRelation?.name || program.level || 'Unknown'}
                    </Badge>
                    <span className="text-xs text-gray-500">{program.campus}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{program._count?.seekers || 0}</span>
                  </div>
                  <span className="text-xs text-gray-500">interested</span>
                </div>
              </div>
            </div>

            <form className="space-y-6">
              {/* Program Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Program Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="e.g., Bachelor of Computer Science"
                  className="h-11"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Level */}
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    Level <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    onValueChange={(value) => form.setValue('level', value)} 
                    value={form.watch('level')}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.name}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.level && (
                    <p className="text-sm text-red-600">{form.formState.errors.level.message}</p>
                  )}
                </div>

                {/* Campus */}
                <div className="space-y-2">
                  <Label htmlFor="campus" className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    Campus <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="campus"
                    {...form.register('campus')}
                    placeholder="e.g., Main Campus"
                    className="h-11"
                  />
                  {form.formState.errors.campus && (
                    <p className="text-sm text-red-600">{form.formState.errors.campus.message}</p>
                  )}
                </div>
              </div>

              {/* Next Intake Date */}
              <div className="space-y-2">
                <Label htmlFor="nextIntakeDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Next Intake Date
                </Label>
                <Input
                  id="nextIntakeDate"
                  type="date"
                  {...form.register('nextIntakeDate')}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Optional: When is the next enrollment period?</p>
              </div>
            </form>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Program'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
