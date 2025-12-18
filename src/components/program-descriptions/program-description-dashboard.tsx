'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EditProgramDescriptionDialog } from './edit-program-description-dialog'
import { GraduationCap, FileText, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Program {
  id: string
  name: string
  level: string | null
  campus: string
  description: string | null
  imageUrl: string | null
}

export function ProgramDescriptionDashboard() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        // Ensure description and imageUrl are included
        const programsWithFields = data.map((p: any) => ({
          ...p,
          description: p.description || null,
          imageUrl: p.imageUrl || null,
        }))
        setPrograms(programsWithFields)
        if (programsWithFields.length > 0 && !selectedProgramId) {
          setSelectedProgramId(programsWithFields[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to load programs')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSuccess = () => {
    fetchPrograms()
    setShowEditDialog(false)
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Program Description Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Select Program</label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>{program.name}</span>
                        <span className="text-xs text-gray-500">
                          ({program.level || 'N/A'} - {program.campus})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProgramId && (
              <Button onClick={() => setShowEditDialog(true)} className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                Edit Description
              </Button>
            )}
          </div>

          {selectedProgram && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">
                    {selectedProgram.name}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {selectedProgram.level || 'N/A'} • {selectedProgram.campus}
                  </p>
                </div>
              </div>
              
              {selectedProgram.imageUrl && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Program Image</span>
                  </div>
                  <div className="relative">
                    {(() => {
                      // Format image URL properly
                      const imageUrl = selectedProgram.imageUrl.startsWith('/') || 
                                       selectedProgram.imageUrl.startsWith('http') || 
                                       selectedProgram.imageUrl.startsWith('data:')
                        ? selectedProgram.imageUrl 
                        : `/${selectedProgram.imageUrl}`
                      
                      return (
                        <>
                          <img 
                            src={imageUrl} 
                            alt={selectedProgram.name}
                            className="w-full max-w-md h-auto rounded-lg border border-purple-200 dark:border-purple-800 object-contain"
                            onError={(e) => {
                              console.error('Image load error for URL:', imageUrl)
                              const target = e.currentTarget
                              const parent = target.parentElement
                              if (parent) {
                                const errorDiv = document.createElement('div')
                                errorDiv.className = 'p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400'
                                errorDiv.innerHTML = `Failed to load image: ${imageUrl}<br><a href="${imageUrl}" target="_blank" class="underline mt-2 inline-block">Try opening in new tab</a>`
                                parent.replaceChild(errorDiv, target)
                              }
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', imageUrl)
                            }}
                          />
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <a 
                              href={imageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              View full image
                            </a>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 break-all">{imageUrl}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              {selectedProgram.description ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Description</span>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert text-purple-800 dark:text-purple-200"
                    dangerouslySetInnerHTML={{ __html: selectedProgram.description }}
                  />
                </div>
              ) : (
                <div className="text-sm text-purple-600 dark:text-purple-400 italic">
                  No description added yet. Click "Edit Description" to add one.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditDialog && selectedProgram && (
        <EditProgramDescriptionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          program={selectedProgram}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

