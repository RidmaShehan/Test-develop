'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpCircle, Loader2, MessageSquare, GraduationCap } from 'lucide-react'

interface QAItem {
  id: string
  question: string
  answer: string
  order: number
}

interface ProgramQA {
  programId: string
  programName: string
  qaItems: QAItem[]
}

interface QAQuickViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programIds: string[]
  programNames: string[]
}

export function QAQuickViewDialog({ 
  open, 
  onOpenChange, 
  programIds, 
  programNames 
}: QAQuickViewDialogProps) {
  const [programsQA, setProgramsQA] = useState<ProgramQA[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && programIds.length > 0) {
      fetchQAItems()
    } else {
      setProgramsQA([])
    }
  }, [open, programIds])

  const fetchQAItems = async () => {
    setLoading(true)
    try {
      // Fetch Q&A items for each program separately
      const qaPromises = programIds.map(async (programId, index) => {
        const response = await fetch(`/api/programs/${programId}/qa`)
        const qaItems: QAItem[] = response.ok ? await response.json() : []
        return {
          programId,
          programName: programNames[index] || `Program ${index + 1}`,
          qaItems: qaItems.sort((a, b) => a.order - b.order)
        }
      })
      
      const results = await Promise.all(qaPromises)
      setProgramsQA(results)
    } catch (error) {
      console.error('Error fetching Q&A items:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalQAItems = programsQA.reduce((sum, p) => sum + p.qaItems.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <span className="text-lg sm:text-xl md:text-2xl font-semibold">Quick Q&A Reference</span>
                {programNames.length > 0 && !loading && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {totalQAItems} {totalQAItems === 1 ? 'item' : 'items'} across {programsQA.length} {programsQA.length === 1 ? 'program' : 'programs'}
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
                View Q&A for each program separately
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
                  <p className="text-sm sm:text-base text-gray-500">Loading Q&A items...</p>
                </div>
              </CardContent>
            </Card>
          ) : programsQA.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {programIds.length === 0 
                    ? 'Please select a program first'
                    : 'No Q&A items available for the selected program(s)'
                  }
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Q&A items can be managed from the Q&A Management page
                </p>
              </CardContent>
            </Card>
          ) : programsQA.length === 1 ? (
            // Single program - no tabs needed
            <div className="space-y-3 sm:space-y-4">
              {programsQA[0].qaItems.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                      No Q&A items available for {programsQA[0].programName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Q&A items can be managed from the Q&A Management page
                    </p>
                  </CardContent>
                </Card>
              ) : (
                programsQA[0].qaItems.map((qa, index) => (
                  <Card key={qa.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm sm:text-base font-semibold mt-0.5 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 break-words">
                            {qa.question}
                          </h4>
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                              {qa.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // Multiple programs - use tabs
            <Tabs defaultValue={programsQA[0]?.programId || ''} className="w-full space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 h-auto overflow-x-auto">
                {programsQA.map((program) => (
                  <TabsTrigger 
                    key={program.programId} 
                    value={program.programId}
                    className="text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                  >
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{program.programName}</span>
                    {program.qaItems.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                        {program.qaItems.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {programsQA.map((program) => (
                <TabsContent 
                  key={program.programId} 
                  value={program.programId}
                  className="space-y-3 sm:space-y-4 w-full overflow-x-hidden"
                >
                  {program.qaItems.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <HelpCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        </div>
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                          No Q&A items available for {program.programName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Q&A items can be managed from the Q&A Management page
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100">
                                {program.programName}
                              </p>
                              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                                {program.qaItems.length} {program.qaItems.length === 1 ? 'Q&A item' : 'Q&A items'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="space-y-3 sm:space-y-4">
                        {program.qaItems.map((qa, index) => (
                          <Card key={qa.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-start gap-3 sm:gap-4">
                                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm sm:text-base font-semibold mt-0.5 shadow-sm">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 break-words">
                                    {qa.question}
                                  </h4>
                                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                      {qa.answer}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
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

