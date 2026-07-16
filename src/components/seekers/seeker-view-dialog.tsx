'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
  Eye,
  Check,
  CheckCheck,
  Plus,
  RefreshCw,
  Send,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { LogInteractionDialog } from './log-interaction-dialog'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type ThreadMessage = {
  id: string
  from: string
  to: string
  subject: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  sentAt: string
  isRead: boolean
  openCount: number
  lastOpenedAt: string | null
}

type EmailThread = {
  id: string
  subject: string
  lastMessageAt: string
  emailAccount: { email: string; provider: string }
  messages: ThreadMessage[]
}

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

  // Email Integration States
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([])
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [currentThread, setCurrentThread] = useState<EmailThread | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Connect & New Email Compose States
  const [emailAccounts, setEmailAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [newEmailSubject, setNewEmailSubject] = useState('')
  const [newEmailContent, setNewEmailContent] = useState('')
  const [sendingNewEmail, setSendingNewEmail] = useState(false)
  const [isStartingNewEmail, setIsStartingNewEmail] = useState(false)

  // Telephony call trigger states
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [agentPhone, setAgentPhone] = useState('')
  const [calling, setCalling] = useState(false)

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

  const fetchEmailThreads = useCallback(async () => {
    if (!seeker.email) return
    setLoadingEmails(true)
    try {
      const res = await fetch(`/api/email/threads?seekerId=${seeker.id}`)
      if (res.ok) {
        const data = await res.json()
        setEmailThreads(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEmails(false)
    }
  }, [seeker.id, seeker.email])

  const fetchEmailAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/email/accounts')
      if (res.ok) {
        const data = await res.json()
        setEmailAccounts(data)
        if (data.length > 0) setSelectedAccountId(data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchThreadDetails = useCallback(async (id: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/email/threads/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentThread(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetails(selectedThreadId)
    } else {
      setCurrentThread(null)
    }
  }, [selectedThreadId, fetchThreadDetails])

  useEffect(() => {
    if (open && seeker) {
      fetchSeekerDetails()
      fetchEmailThreads()
      fetchEmailAccounts()

      const savedPhone = localStorage.getItem('crm_agent_phone')
      if (savedPhone) setAgentPhone(savedPhone)
    }
  }, [open, seeker, fetchSeekerDetails, fetchEmailThreads, fetchEmailAccounts])

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadId) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/email/threads/${selectedThreadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.replace(/\n/g, '<br/>') }),
      })
      if (res.ok) {
        toast.success('Reply sent successfully')
        setReplyText('')
        fetchThreadDetails(selectedThreadId)
        fetchEmailThreads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to send reply')
      }
    } catch (err) {
      toast.error('Error sending reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleStartNewEmail = async () => {
    if (!newEmailSubject.trim() || !newEmailContent.trim() || !selectedAccountId) return
    setSendingNewEmail(true)
    try {
      const res = await fetch('/api/email/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailAccountId: selectedAccountId,
          seekerId: seeker.id,
          subject: newEmailSubject,
          content: newEmailContent.replace(/\n/g, '<br/>')
        }),
      })
      if (res.ok) {
        toast.success('Email conversation started!')
        setNewEmailSubject('')
        setNewEmailContent('')
        setIsStartingNewEmail(false)
        fetchEmailThreads()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to start conversation')
      }
    } catch (err) {
      toast.error('Error starting conversation')
    } finally {
      setSendingNewEmail(false)
    }
  }

  const handleInitiateCall = async () => {
    if (!agentPhone.trim()) {
      toast.error('Please enter your phone number to bridge the call.')
      return
    }
    setCalling(true)
    try {
      localStorage.setItem('crm_agent_phone', agentPhone)
      const res = await fetch('/api/telephony/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seekerId: seeker.id, agentPhone }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Call initiated! Twilio is dialing your phone first.')
        setShowCallDialog(false)
      } else {
        toast.error(data.error || 'Failed to place call')
      }
    } catch (err) {
      toast.error('Error placing call')
    } finally {
      setCalling(false)
    }
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100',
      ATTEMPTING_CONTACT: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      CONNECTED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      QUALIFIED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      COUNSELING_SCHEDULED: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
      CONSIDERING: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
      READY_TO_REGISTER: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
      LOST: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    }
    return colors[stage] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
  }

  const getOutcomeColor = (outcome: string) => {
    const colors: Record<string, string> = {
      CONNECTED_INTERESTED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      NO_ANSWER: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      NOT_INTERESTED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      APPOINTMENT_BOOKED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      WRONG_NUMBER: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100',
      DO_NOT_CONTACT: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    }
    return colors[outcome] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
  }

  const getTaskStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      DONE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      OVERDUE: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{seeker.phone}</span>
                        {seeker.whatsapp && (
                          <Badge variant="secondary" className="text-xs">WhatsApp</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-primary/30 hover:bg-primary hover:text-white"
                        onClick={() => setShowCallDialog(true)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
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

            <TabsContent value="emails" className="space-y-4">
              {isStartingNewEmail ? (
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">New Email Conversation</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">Send From Account</label>
                      <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select email account" />
                        </SelectTrigger>
                        <SelectContent>
                          {emailAccounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id} className="text-xs">
                              {acc.email} ({acc.provider})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">Subject</label>
                      <Input
                        type="text"
                        placeholder="Enter email subject"
                        value={newEmailSubject}
                        onChange={(e) => setNewEmailSubject(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">Message Body</label>
                      <Textarea
                        placeholder="Write your email here..."
                        value={newEmailContent}
                        onChange={(e) => setNewEmailContent(e.target.value)}
                        rows={5}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setIsStartingNewEmail(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="text-xs h-8" disabled={sendingNewEmail || !newEmailSubject.trim() || !newEmailContent.trim()} onClick={handleStartNewEmail}>
                        {sendingNewEmail ? 'Sending...' : 'Send Email'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : selectedThreadId && currentThread ? (
                <div className="flex flex-col border rounded-lg bg-card h-[400px]">
                  {/* Internal header */}
                  <div className="p-3 border-b flex items-center justify-between bg-muted/10">
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold truncate text-foreground">{currentThread.subject}</h4>
                      <p className="text-[10px] text-muted-foreground">via {currentThread.emailAccount.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={() => setSelectedThreadId(null)}>
                      Back to threads
                    </Button>
                  </div>

                  {/* Messages list */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {currentThread.messages.map((message) => {
                        const isOutbound = message.direction === 'OUTBOUND'
                        return (
                          <div
                            key={message.id}
                            className={`flex flex-col max-w-[85%] rounded-lg p-2.5 border ${
                              isOutbound ? 'bg-primary/5 border-primary/20 ml-auto' : 'bg-muted/20 border-border/60 mr-auto'
                            }`}
                          >
                            <div className="flex justify-between gap-4 mb-1 text-[9px] text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {isOutbound ? 'You' : seeker.fullName}
                              </span>
                              <span>{new Date(message.sentAt).toLocaleString()}</span>
                            </div>
                            <div
                              className="text-[11px] whitespace-pre-line text-foreground"
                              dangerouslySetInnerHTML={{ __html: message.body.replace(/<img[^>]+track\/open[^>]+>/gi, '') }}
                            />
                            {isOutbound && (
                              <div className="flex justify-end items-center gap-1 mt-1 text-[9px] text-muted-foreground">
                                {message.openCount > 0 ? (
                                  <>
                                    <Eye className="h-2.5 w-2.5 text-green-500" />
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      Opened {message.openCount}x
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="h-2.5 w-2.5 text-muted-foreground" />
                                    <span>Sent</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>

                  {/* Reply form */}
                  <div className="p-3 border-t bg-muted/10">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="resize-none text-xs"
                      />
                      <Button
                        size="icon"
                        disabled={sendingReply || !replyText.trim()}
                        onClick={handleSendReply}
                        className="h-9 w-9 self-end flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Email Threads</h3>
                    {emailAccounts.length > 0 && (
                      <Button size="sm" onClick={() => setIsStartingNewEmail(true)} className="text-xs h-7">
                        <Plus className="h-3 w-3 mr-1" />
                        New Email
                      </Button>
                    )}
                  </div>

                  {loadingEmails ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">Loading emails...</div>
                  ) : emailThreads.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60 stroke-[1.2]" />
                      <p className="text-xs">No email conversation history with this student</p>
                      {emailAccounts.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground mt-1">Connect your email account in settings or inbox to write emails</p>
                      ) : (
                        <Button size="sm" className="mt-3 text-xs h-7" onClick={() => setIsStartingNewEmail(true)}>
                          Start Conversation
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y divide-border/60">
                      {emailThreads.map((thread) => {
                        const lastMsg = thread.messages[0]
                        return (
                          <div
                            key={thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                            className="p-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">{thread.subject}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                Last message {formatDistanceToNow(new Date(thread.lastMessageAt))} ago
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
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

      {showCallDialog && (
        <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Initiate Click-to-Call</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                Enter your phone number (e.g. +1234567890). Twilio will call your phone first, and when you answer, it will dial the student and bridge both lines.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Your Phone Number</label>
                <Input
                  type="text"
                  placeholder="+1..."
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  className="w-full text-xs h-9"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCallDialog(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="text-xs" disabled={calling || !agentPhone.trim()} onClick={handleInitiateCall}>
                  {calling ? 'Connecting...' : 'Call Now'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
