'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, Mail, User, MapPin, Clock } from 'lucide-react'
import { LogInteractionDialog } from './log-interaction-dialog'

interface Seeker {
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
  whatsapp?: boolean
  consent?: boolean
  createdAt: string
  programInterest?: {
    name: string
  }
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

interface SeekerViewDialogProps {
  seeker: Seeker
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SeekerViewDialog({ seeker, open, onOpenChange }: SeekerViewDialogProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([])
  const [loading, setLoading] = useState(false)
  const [showLogInteraction, setShowLogInteraction] = useState(false)

  const fetchSeekerDetails = useCallback(async () => {
    setLoading(true)
    try {
      const [interactionsRes, tasksRes] = await Promise.all([
        fetch(`/api/seekers/${seeker.id}/interactions`),
        fetch(`/api/seekers/${seeker.id}/tasks`)
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
      console.error('Error fetching seeker details:', error)
    } finally {
      setLoading(false)
    }
  }, [seeker?.id])

  useEffect(() => {
    if (open && seeker) {
      fetchSeekerDetails()
    }
  }, [open, seeker, fetchSeekerDetails])

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{seeker.fullName}</span>
              <Badge className={getStageColor(seeker.stage)}>
                {seeker.stage.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{seeker.fullName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{seeker.phone}</span>
                      {seeker.whatsapp && (
                        <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                      )}
                    </div>
                    {seeker.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{seeker.email}</span>
                      </div>
                    )}
                    {seeker.city && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{seeker.city}</span>
                      </div>
                    )}
                    {seeker.preferredContactTime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{seeker.preferredContactTime}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Program & Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {seeker.programInterest && (
                      <div>
                        <p className="font-medium">{seeker.programInterest.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Marketing Source</p>
                      <Badge className="bg-blue-100 text-blue-800">
                        {seeker.marketingSource.replace('_', ' ')}
                      </Badge>
                    </div>
                    {seeker.ageBand && (
                      <div>
                        <p className="text-sm text-gray-600">Age Band</p>
                        <p className="font-medium">{seeker.ageBand}</p>
                      </div>
                    )}
                    {seeker.guardianPhone && (
                      <div>
                        <p className="text-sm text-gray-600">Guardian Phone</p>
                        <p className="font-medium">{seeker.guardianPhone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowLogInteraction(true)}>
                  Log Interaction
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Interaction History</h3>
                <Button onClick={() => setShowLogInteraction(true)}>
                  Log New Interaction
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading interactions...</div>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interactions.map((interaction) => (
                        <TableRow key={interaction.id}>
                          <TableCell>
                            {new Date(interaction.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {interaction.channel.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getOutcomeColor(interaction.outcome)}>
                              {interaction.outcome.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{interaction.user.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {interaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Follow-up Tasks</h3>
                <Button>
                  Create Task
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading tasks...</div>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {followUpTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {task.purpose.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTaskStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(task.dueAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{task.user.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {task.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <h3 className="text-lg font-medium">Activity Timeline</h3>
              <div className="space-y-4">
                {/* Timeline items would go here */}
                <div className="text-center py-8 text-gray-500">
                  Timeline view coming soon...
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showLogInteraction && (
        <LogInteractionDialog
          seeker={seeker}
          open={showLogInteraction}
          onOpenChange={setShowLogInteraction}
          onSuccess={() => {
            fetchSeekerDetails()
            setShowLogInteraction(false)
          }}
        />
      )}
    </>
  )
}
