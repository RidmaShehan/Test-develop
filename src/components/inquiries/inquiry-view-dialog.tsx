'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, MessageSquare, Mail, Calendar, User, MapPin, Clock, Sparkles, HelpCircle, FileText } from 'lucide-react'
import { LogInteractionDialog } from '@/components/inquiries/log-interaction-dialog'

interface Inquiry {
  id: string
  fullName: string
  phone: string
  email?: string
  city?: string
  ageBand?: string
  guardianPhone?: string
  stage: string
  marketingSource: string
  preferredContactTime?: string
  preferredStatus?: number
  followUpAgain?: boolean
  followUpDate?: string
  followUpTime?: string
  description?: string
  whatsapp: boolean
  whatsappNumber?: string
  notAnswering?: boolean
  emailNotAnswering?: boolean
  registerNow?: boolean
  consent: boolean
  createdAt: string
  programInterest?: {
    id: string
    name: string
    level: string
    campus: string
  }
  preferredPrograms?: {
    id: string
    program: {
      id: string
      name: string
      level: string
      campus: string
    }
  }[]
  campaigns?: {
    id: string
    campaign: {
      id: string
      name: string
      type: string
    }
  }[]
}

interface Interaction {
  id: string
  channel: string
  outcome: string
  notes?: string
  createdAt: string
  user: {
    name: string
  }
}

interface FollowUpTask {
  id: string
  purpose: string
  status: string
  dueAt: string
  notes?: string
  user: {
    name: string
  }
}

interface InquiryViewDialogProps {
  inquiry: Inquiry
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QAItem {
  id: string
  question: string
  answer: string
  order: number
}

export function InquiryViewDialog({ inquiry, open, onOpenChange }: InquiryViewDialogProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([])
  const [qaItems, setQaItems] = useState<QAItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingQA, setLoadingQA] = useState(false)
  const [showLogInteraction, setShowLogInteraction] = useState(false)

  const latestCallDurationMinutes = (() => {
    const call = interactions.find(
      (i) => i.channel === 'CALL' && typeof i.notes === 'string' && i.notes.includes('Call Duration:')
    )
    if (!call?.notes) return undefined
    const match = call.notes.match(/Call Duration:\s*(\d+)\s*minutes/i)
    if (!match) return undefined
    const mins = Number(match[1])
    return isNaN(mins) ? undefined : mins
  })()


  const fetchInquiryDetails = async () => {
    setLoading(true)
    try {
      const [interactionsRes, tasksRes] = await Promise.all([
        fetch(`/api/inquiries/${inquiry.id}/interactions`),
        fetch(`/api/inquiries/${inquiry.id}/tasks`)
      ])

      if (interactionsRes.ok) {
        const interactionsData = await interactionsRes.json()
        setInteractions(interactionsData)
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setFollowUpTasks(tasksData)
      }
    } catch (error) {
      console.error('Error fetching inquiry details:', error)
    } finally {
      setLoading(false)
    }
  }

  const [programDetails, setProgramDetails] = useState<Array<{
    id: string
    name: string
    description: string | null
    imageUrl: string | null
  }>>([])

  const fetchQAItems = async () => {
    if (!inquiry) return
    
    setLoadingQA(true)
    try {
      // Get program IDs from inquiry
      const programIds: string[] = []
      
      if (inquiry.preferredPrograms && inquiry.preferredPrograms.length > 0) {
        inquiry.preferredPrograms.forEach(pref => {
          if (pref.program?.id && !programIds.includes(pref.program.id)) {
            programIds.push(pref.program.id)
          }
        })
      }

      // Fetch Q&A items and program details for all programs
      if (programIds.length > 0) {
        const [qaResults, programDetailsResults] = await Promise.all([
          Promise.all(programIds.map(programId =>
            fetch(`/api/programs/${programId}/qa`).then(res => res.ok ? res.json() : [])
          )),
          Promise.all(programIds.map(programId =>
            fetch(`/api/programs/${programId}`).then(res => res.ok ? res.json() : null)
          ))
        ])
        
        const allQAItems = qaResults.flat()
        
        // Remove duplicates and sort by order
        const uniqueQAItems = Array.from(
          new Map(allQAItems.map((item: QAItem) => [item.id, item])).values()
        ).sort((a, b) => a.order - b.order)
        
        setQaItems(uniqueQAItems)
        setProgramDetails(programDetailsResults.filter(Boolean).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl
        })))
      } else {
        setQaItems([])
        setProgramDetails([])
      }
    } catch (error) {
      console.error('Error fetching Q&A items:', error)
    } finally {
      setLoadingQA(false)
    }
  }

  useEffect(() => {
    if (open && inquiry) {
      fetchInquiryDetails()
      fetchQAItems()
    }
  }, [open, inquiry?.id])


  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-gray-100 text-gray-800',
      ATTEMPTING_CONTACT: 'bg-yellow-100 text-yellow-800',
      CONNECTED: 'bg-blue-100 text-blue-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      COUNSELING_SCHEDULED: 'bg-purple-100 text-purple-800',
      CONSIDERING: 'bg-orange-100 text-orange-800',
      READY_TO_REGISTER: 'bg-emerald-100 text-emerald-800',
      LOST: 'bg-red-100 text-red-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      CONNECTED_INTERESTED: 'bg-green-100 text-green-800',
      NO_ANSWER: 'bg-yellow-100 text-yellow-800',
      NOT_INTERESTED: 'bg-red-100 text-red-800',
      APPOINTMENT_BOOKED: 'bg-blue-100 text-blue-800',
      WRONG_NUMBER: 'bg-gray-100 text-gray-800',
      DO_NOT_CONTACT: 'bg-red-100 text-red-800',
    }
    return colors[outcome] || 'bg-gray-100 text-gray-800'
  }

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      DONE: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <span className="text-lg sm:text-xl md:text-2xl font-semibold break-words">{inquiry.fullName}</span>
              <Badge className={getStageColor(inquiry.stage)}>
                {inquiry.stage.replace(/_/g, ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="qa" className="text-xs sm:text-sm">Q&A</TabsTrigger>
              <TabsTrigger value="interactions" className="text-xs sm:text-sm">Interactions</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs sm:text-sm">Tasks</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="w-full overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base break-words">{inquiry.fullName}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base break-all">{inquiry.phone}</span>
                      {inquiry.whatsapp && (
                        <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                      )}
                    </div>
                    {inquiry.whatsappNumber && inquiry.whatsappNumber !== inquiry.phone && (
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-all">{inquiry.whatsappNumber}</span>
                        <Badge variant="secondary" className="text-xs">WhatsApp #</Badge>
                      </div>
                    )}
                    {inquiry.notAnswering && (
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <Phone className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs sm:text-sm font-medium">
                          Not Answering
                        </Badge>
                      </div>
                    )}
                    {inquiry.email && (
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm sm:text-base break-all">{inquiry.email}</span>
                        {inquiry.emailNotAnswering && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs sm:text-sm font-medium">
                            Not Answering
                          </Badge>
                        )}
                      </div>
                    )}
                    {inquiry.city && (
                      <div className="flex items-center space-x-2 flex-wrap">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{inquiry.city}</span>
                      </div>
                    )}
                    {inquiry.preferredContactTime && (
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm sm:text-base">{inquiry.preferredContactTime}</span>
                      </div>
                    )}
                    {!inquiry.notAnswering && latestCallDurationMinutes !== undefined && (
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs sm:text-sm font-medium">
                          Call Duration: {latestCallDurationMinutes} minutes
                        </Badge>
                      </div>
                    )}
                    {inquiry.followUpDate && (
                      <div className="flex items-center space-x-2 flex-wrap">
                        <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm sm:text-base">
                          {inquiry.followUpDate}
                          {inquiry.followUpTime && ` at ${inquiry.followUpTime}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs sm:text-sm text-gray-600">Consent:</span>
                      {inquiry.consent ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Given</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">Not Given</Badge>
                      )}
                    </div>
                    {inquiry.preferredStatus && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">Preferred Status:</span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="flex flex-1 sm:flex-none w-32 h-5 sm:h-6 border border-gray-300 rounded overflow-hidden">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div
                                key={i}
                                className={`flex-1 border-r border-gray-300 last:border-r-0 ${
                                  i < (inquiry.preferredStatus || 0)
                                    ? 'bg-red-500'
                                    : 'bg-gray-100'
                                }`}
                                style={{
                                  backgroundColor: i < (inquiry.preferredStatus || 0)
                                    ? (() => {
                                        const progress = (i + 1) / 10 // 0.1 to 1.0
                                        if (progress <= 0.5) {
                                          // Red to Yellow (0.1 to 0.5)
                                          const localProgress = progress * 2 // 0.2 to 1.0
                                          const red = 255
                                          const green = Math.floor(255 * localProgress)
                                          const blue = 0
                                          return `rgba(${red}, ${green}, ${blue}, 0.8)`
                                        } else {
                                          // Yellow to Green (0.5 to 1.0)
                                          const localProgress = (progress - 0.5) * 2 // 0.0 to 1.0
                                          const red = Math.floor(255 * (1 - localProgress))
                                          const green = 255
                                          const blue = 0
                                          return `rgba(${red}, ${green}, ${blue}, 0.8)`
                                        }
                                      })()
                                    : 'rgba(156, 163, 175, 0.3)'
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {inquiry.preferredStatus}/10
                          </span>
                        </div>
                      </div>
                    )}
                    {inquiry.description && (
                      <div className="mt-3 sm:mt-4">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Description:</span>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">{inquiry.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-full overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Program & Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {inquiry.preferredPrograms && inquiry.preferredPrograms.length > 0 ? (
                      <div>
                        <p className="font-medium mb-2 text-sm sm:text-base">Preferred Programs:</p>
                        <div className="flex flex-wrap gap-2">
                          {inquiry.preferredPrograms.map((pref, index) => (
                            <div key={pref.id} className="flex-1 min-w-[200px] p-2 sm:p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="font-medium text-sm sm:text-base">{pref.program.name}</p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">{pref.program.level}</p>
                              <p className="text-xs sm:text-sm text-gray-600">{pref.program.campus}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : inquiry.programInterest && (
                      <div>
                        <p className="font-medium text-sm sm:text-base">{inquiry.programInterest.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{inquiry.programInterest.level}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{inquiry.programInterest.campus}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Marketing Source</p>
                      <Badge className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
                        {inquiry.marketingSource.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {inquiry.campaigns && inquiry.campaigns.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Campaign</p>
                        <div className="flex flex-wrap gap-2">
                          {inquiry.campaigns.map((campaignRef) => (
                            <Badge key={campaignRef.id} className="bg-purple-100 text-purple-800 text-xs sm:text-sm">
                              {campaignRef.campaign.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {inquiry.registerNow && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Status</p>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm font-medium">
                          Register Now
                        </Badge>
                      </div>
                    )}
                    {inquiry.guardianPhone && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Guardian Phone</p>
                        <p className="font-medium text-sm sm:text-base break-all">{inquiry.guardianPhone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-2">
                <Button onClick={() => setShowLogInteraction(true)} className="w-full sm:w-auto">
                  Log Interaction
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qa" className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-medium">Program Q&A & Descriptions</h3>
              </div>

              {loadingQA ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-sm sm:text-base text-gray-500">Loading Q&A items...</p>
                  </CardContent>
                </Card>
              ) : qaItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-500">
                      No Q&A items available for the selected programs
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      Q&A items can be managed from the Q&A Management page
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Program Descriptions */}
                  {programDetails.length > 0 && programDetails.some(p => p.description || p.imageUrl) && (
                    <div className="space-y-4">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Program Descriptions
                      </h4>
                      {programDetails.map((program) => (
                        (program.description || program.imageUrl) && (
                          <Card key={program.id} className="border-l-4 border-l-purple-500">
                            <CardHeader>
                              <CardTitle className="text-base sm:text-lg">{program.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {program.imageUrl && (
                                <div>
                                  <img 
                                    src={program.imageUrl} 
                                    alt={program.name}
                                    className="w-full max-w-md h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                  />
                                </div>
                              )}
                              {program.description && (
                                <div 
                                  className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                                  dangerouslySetInnerHTML={{ __html: program.description }}
                                />
                              )}
                            </CardContent>
                          </Card>
                        )
                      ))}
                    </div>
                  )}

                  {/* Q&A Items */}
                  {qaItems.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Frequently Asked Questions
                      </h4>
                      {qaItems.map((qa, index) => (
                        <Card key={qa.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-semibold mt-0.5">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-2">
                                  {qa.question}
                                </h4>
                                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {qa.answer}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {qaItems.length === 0 && programDetails.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-500">
                          No Q&A items or descriptions available for the selected programs
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h3 className="text-base sm:text-lg font-medium">Interaction History</h3>
                <Button onClick={() => setShowLogInteraction(true)} className="w-full sm:w-auto">
                  Log New Interaction
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-4 text-sm sm:text-base">Loading interactions...</div>
              ) : interactions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <p className="text-sm sm:text-base">No interactions recorded yet</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Date</TableHead>
                          <TableHead className="min-w-[100px]">Channel</TableHead>
                          <TableHead className="min-w-[120px]">Outcome</TableHead>
                          <TableHead className="min-w-[120px]">User</TableHead>
                          <TableHead className="min-w-[200px]">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interactions.map((interaction) => (
                          <TableRow key={interaction.id}>
                            <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                              {new Date(interaction.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {interaction.channel.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getOutcomeColor(interaction.outcome)} text-xs`}>
                                {interaction.outcome.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{interaction.user.name}</TableCell>
                            <TableCell className="max-w-xs truncate text-xs sm:text-sm">
                              {interaction.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 pb-3 sm:pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Follow-up Tasks</h3>
                  {followUpTasks.length > 0 && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
                      {followUpTasks.filter(t => t.notes?.includes('Automatic follow-up')).length} automatic follow-up(s) created
                    </p>
                  )}
                </div>
                <Button className="w-full sm:w-auto mt-2 sm:mt-0 shadow-sm">
                  Create Task
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm sm:text-base text-gray-600">Loading tasks...</p>
                </div>
              ) : followUpTasks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 mb-1">No follow-up tasks yet</p>
                    <p className="text-xs sm:text-sm text-gray-500">Create a task to track follow-up activities</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Card className="w-full overflow-hidden border shadow-sm">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gray-50/50">
                            <TableRow>
                              <TableHead className="min-w-[160px] font-semibold text-gray-900">Type</TableHead>
                              <TableHead className="min-w-[120px] font-semibold text-gray-900">Purpose</TableHead>
                              <TableHead className="min-w-[110px] font-semibold text-gray-900">Status</TableHead>
                              <TableHead className="min-w-[160px] font-semibold text-gray-900">Due Date</TableHead>
                              <TableHead className="min-w-[140px] font-semibold text-gray-900">Assigned To</TableHead>
                              <TableHead className="min-w-[250px] font-semibold text-gray-900">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {followUpTasks.map((task) => {
                              const isAutomatic = task.notes?.includes('Automatic follow-up') || false
                              const followUpNumber = task.notes?.match(/#(\d+)/)?.[1] || ''
                              const isFirst = followUpNumber === '1'
                              const isSecond = followUpNumber === '2'
                              
                              return (
                                <TableRow key={task.id} className={`hover:bg-gray-50/50 transition-colors ${isAutomatic ? 'bg-blue-50/30 border-l-4 border-l-blue-500' : ''}`}>
                                  <TableCell>
                                    {isAutomatic ? (
                                      <div className="flex flex-col gap-1.5">
                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 w-fit text-xs font-medium shadow-sm">
                                          <span className="flex items-center gap-1.5">
                                            <Sparkles className="h-3 w-3" />
                                            <span>Auto #{followUpNumber}</span>
                                          </span>
                                        </Badge>
                                        <span className="text-xs text-blue-600 font-medium">
                                          {isFirst ? '3 days after inquiry' : isSecond ? '7 days after inquiry' : 'System generated'}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium">
                                        Manual
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs font-medium">
                                      {task.purpose.replace(/_/g, ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${getTaskStatusColor(task.status)} text-xs font-medium shadow-sm`}>
                                      {task.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-sm text-gray-900">
                                        {new Date(task.dueAt).toLocaleDateString()}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium text-gray-700">{task.user.name}</TableCell>
                                  <TableCell>
                                    <div className="max-w-xs">
                                      <p className="text-sm text-gray-700 line-clamp-2" title={task.notes || '-'}>
                                        {task.notes || '-'}
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-3">
                    {followUpTasks.map((task) => {
                      const isAutomatic = task.notes?.includes('Automatic follow-up') || false
                      const followUpNumber = task.notes?.match(/#(\d+)/)?.[1] || ''
                      const isFirst = followUpNumber === '1'
                      const isSecond = followUpNumber === '2'
                      
                      return (
                        <Card key={task.id} className={`overflow-hidden ${isAutomatic ? 'border-l-4 border-l-blue-500 bg-blue-50/20' : ''}`}>
                          <CardContent className="p-4 sm:p-5">
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {isAutomatic ? (
                                    <div className="flex flex-col gap-1.5">
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 w-fit text-xs font-medium shadow-sm">
                                        <span className="flex items-center gap-1.5">
                                          <Sparkles className="h-3 w-3" />
                                          <span>Auto #{followUpNumber}</span>
                                        </span>
                                      </Badge>
                                      <span className="text-xs text-blue-600 font-medium">
                                        {isFirst ? '3 days after inquiry' : isSecond ? '7 days after inquiry' : 'System generated'}
                                      </span>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium">
                                      Manual
                                    </Badge>
                                  )}
                                </div>
                                <Badge className={`${getTaskStatusColor(task.status)} text-xs font-medium shadow-sm`}>
                                  {task.status}
                                </Badge>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Purpose</p>
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {task.purpose.replace(/_/g, ' ')}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Due Date</p>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-gray-900">
                                      {new Date(task.dueAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="sm:col-span-2">
                                  <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                                  <p className="text-sm font-medium text-gray-700">{task.user.name}</p>
                                </div>
                                {task.notes && (
                                  <div className="sm:col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                                    <p className="text-sm text-gray-700 break-words">{task.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              <h3 className="text-base sm:text-lg font-medium">Activity Timeline</h3>
              <div className="space-y-4">
                {/* Timeline items would go here */}
                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                  Timeline view coming soon...
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showLogInteraction && (
        <LogInteractionDialog
          inquiry={inquiry}
          open={showLogInteraction}
          onOpenChange={setShowLogInteraction}
          onSuccess={() => {
            fetchInquiryDetails()
            setShowLogInteraction(false)
          }}
        />
      )}
    </>
  )
}
