'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Loader2, GraduationCap, Image as ImageIcon } from 'lucide-react'

interface ProgramDetails {
  programId: string
  programName: string
  level: string | null
  campus: string
  description: string | null
  imageUrl: string | null
}

interface ProgramDetailsQuickViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programIds: string[]
  programNames: string[]
}

export function ProgramDetailsQuickViewDialog({ 
  open, 
  onOpenChange, 
  programIds, 
  programNames 
}: ProgramDetailsQuickViewDialogProps) {
  const [programsDetails, setProgramsDetails] = useState<ProgramDetails[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && programIds.length > 0) {
      fetchProgramDetails()
    } else {
      setProgramsDetails([])
    }
  }, [open, programIds])

  const fetchProgramDetails = async () => {
    setLoading(true)
    try {
      // Fetch program details for each program separately
      const detailsPromises = programIds.map(async (programId, index) => {
        const response = await fetch(`/api/programs/${programId}`)
        if (response.ok) {
          const program = await response.json()
          return {
            programId,
            programName: program.name || programNames[index] || `Program ${index + 1}`,
            level: program.level || program.levelRelation?.name || null,
            campus: program.campus || '',
            description: program.description || null,
            imageUrl: program.imageUrl || null,
          }
        }
        return {
          programId,
          programName: programNames[index] || `Program ${index + 1}`,
          level: null,
          campus: '',
          description: null,
          imageUrl: null,
        }
      })
      
      const results = await Promise.all(detailsPromises)
      setProgramsDetails(results)
    } catch (error) {
      console.error('Error fetching program details:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasDetails = programsDetails.some(p => p.description || p.imageUrl)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <span className="text-lg sm:text-xl md:text-2xl font-semibold">Program Details</span>
                {programNames.length > 0 && !loading && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {programsDetails.filter(p => p.description || p.imageUrl).length} {programsDetails.filter(p => p.description || p.imageUrl).length === 1 ? 'program' : 'programs'} with details
                  </p>
                )}
              </div>
            </div>
            {programNames.length > 0 && (
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {programNames.length} {programNames.length === 1 ? 'Program' : 'Programs'}
              </Badge>
            )}
          </DialogTitle>
          {programNames.length > 0 && (
            <div className="pt-2 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span>
                View detailed descriptions and images for each program
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-gray-400 mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">Loading program details...</p>
                </div>
              </CardContent>
            </Card>
          ) : !hasDetails ? (
            <Card className="border-dashed">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {programIds.length === 0 
                    ? 'Please select a program first'
                    : 'No program details available for the selected program(s)'
                  }
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Program details can be managed from the Program Descriptions page
                </p>
              </CardContent>
            </Card>
          ) : programsDetails.length === 1 ? (
            // Single program - no tabs needed
            <div className="space-y-4">
              {programsDetails[0].description || programsDetails[0].imageUrl ? (
                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      {programsDetails[0].programName}
                    </CardTitle>
                    {(programsDetails[0].level || programsDetails[0].campus) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {programsDetails[0].level || 'N/A'} • {programsDetails[0].campus}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {programsDetails[0].imageUrl && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium">Program Image</span>
                        </div>
                        <img 
                          src={programsDetails[0].imageUrl} 
                          alt={programsDetails[0].programName}
                          className="w-full max-w-2xl h-auto rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
                          onError={(e) => {
                            console.error('Image load error:', programsDetails[0].imageUrl)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    {programsDetails[0].description && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium">Description</span>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                          dangerouslySetInnerHTML={{ __html: programsDetails[0].description }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <p className="text-sm sm:text-base text-gray-500">
                      No details available for {programsDetails[0].programName}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Multiple programs - use tabs
            <Tabs defaultValue={programsDetails[0]?.programId || ''} className="w-full space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-auto overflow-x-auto">
                {programsDetails.map((program) => (
                  <TabsTrigger 
                    key={program.programId} 
                    value={program.programId}
                    className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                  >
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{program.programName}</span>
                    {(program.description || program.imageUrl) && (
                      <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                        <FileText className="h-3 w-3" />
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {programsDetails.map((program) => (
                <TabsContent 
                  key={program.programId} 
                  value={program.programId}
                  className="space-y-4 w-full overflow-x-hidden"
                >
                  {program.description || program.imageUrl ? (
                    <Card className="border-l-4 border-l-purple-500 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          {program.programName}
                        </CardTitle>
                        {(program.level || program.campus) && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {program.level || 'N/A'} • {program.campus}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {program.imageUrl && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-medium">Program Image</span>
                            </div>
                            <img 
                              src={program.imageUrl} 
                              alt={program.programName}
                              className="w-full max-w-2xl h-auto rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
                              onError={(e) => {
                                console.error('Image load error:', program.imageUrl)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        {program.description && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm font-medium">Description</span>
                            </div>
                            <div 
                              className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                              dangerouslySetInnerHTML={{ __html: program.description }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                          No details available for {program.programName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Program details can be managed from the Program Descriptions page
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t">
          <Button 
            onClick={() => onOpenChange(false)} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
