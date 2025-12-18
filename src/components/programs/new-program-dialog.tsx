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
import { toast } from 'sonner'
import { GraduationCap, Building2, Calendar, BookOpen, Loader2 } from 'lucide-react'

const programSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  level: z.string().min(1, 'Level is required'),
  campus: z.string().min(1, 'Campus is required'),
  nextIntakeDate: z.string().optional(),
})

type ProgramFormData = z.infer<typeof programSchema>

interface NewProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NewProgramDialog({ open, onOpenChange, onSuccess }: NewProgramDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [levels, setLevels] = useState<Array<{ id: string; name: string }>>([])
  
  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      level: '',
      campus: '',
      nextIntakeDate: '',
    }
  })

  useEffect(() => {
    if (open) {
      fetchLevels()
      form.reset()
    }
  }, [open, form])

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
    setIsLoading(true)
    try {
      const selectedLevel = levels.find(level => level.name === data.level)
      
      const response = await fetch('/api/programs', {
        method: 'POST',
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
        throw new Error('Failed to create program')
      }

      toast.success('Program created successfully')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
      window.location.reload()
    } catch (error) {
      toast.error('Failed to create program')
      console.error('Error creating program:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Add New Program</DialogTitle>
              <DialogDescription>Create a new educational program</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Program Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
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
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  Level <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => form.setValue('level', value)}>
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
                  <Building2 className="h-4 w-4 text-emerald-600" />
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
                <Calendar className="h-4 w-4 text-emerald-600" />
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
            className="h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Program'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
