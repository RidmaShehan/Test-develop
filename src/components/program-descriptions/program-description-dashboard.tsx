'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EditProgramDescriptionDialog } from './edit-program-description-dialog'
import { GraduationCap, FileText, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SanitizedHtml } from '@/components/ui/sanitized-html'

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
  const [imageDecoding, setImageDecoding] = useState(false)
  const [imageDecodeError, setImageDecodeError] = useState<string | null>(null)

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
  const selectedImageUrl = selectedProgram?.imageUrl
    ? (selectedProgram.imageUrl.startsWith('/') ||
       selectedProgram.imageUrl.startsWith('http') ||
       selectedProgram.imageUrl.startsWith('data:')
        ? selectedProgram.imageUrl
        : `/${selectedProgram.imageUrl}`)
    : null

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
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-100 leading-snug">
                    {selectedProgram.name}
                  </p>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
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
                    {imageDecoding && (
                      <div className="mb-2 text-xs text-indigo-600">Decoding image preview...</div>
                    )}
                    {imageDecodeError && (
                      <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                        {imageDecodeError}
                      </div>
                    )}
                    {selectedImageUrl && (
                      <>
                        <img
                          src={selectedImageUrl}
                          alt={selectedProgram.name}
                          className="w-full max-w-md h-auto rounded-lg border border-purple-200 dark:border-purple-800 object-contain"
                          onLoadStart={() => {
                            setImageDecoding(true)
                            setImageDecodeError(null)
                          }}
                          onError={() => {
                            setImageDecoding(false)
                            setImageDecodeError('Failed to decode image. Please re-upload.')
                          }}
                          onLoad={() => {
                            setImageDecoding(false)
                            setImageDecodeError(null)
                          }}
                        />
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <a
                            href={selectedImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            View full image
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedProgram.description ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-base font-bold underline text-purple-900 dark:text-purple-100">
                      Description
                    </span>
                  </div>
                  <div className="rounded-md border border-purple-200/70 dark:border-purple-800/70 bg-white/70 dark:bg-purple-950/30 p-4">
                    <SanitizedHtml
                      html={selectedProgram.description}
                      className="prose max-w-none dark:prose-invert text-purple-900 dark:text-purple-100 prose-p:my-2 prose-p:text-base prose-strong:font-bold prose-li:my-1 prose-headings:font-bold prose-headings:underline prose-headings:text-purple-900 dark:prose-headings:text-purple-100"
                    />
                  </div>
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

