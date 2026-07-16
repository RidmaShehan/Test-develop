'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  RefreshCw,
  Send,
  Link as LinkIcon,
  Check,
  CheckCheck,
  Eye,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

type ConnectedAccount = {
  id: string
  email: string
  provider: 'GMAIL' | 'MICROSOFT'
  createdAt: string
}

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
  seeker: { id: string; fullName: string; email: string } | null
  messages: ThreadMessage[]
}

function InboxPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [currentThread, setCurrentThread] = useState<EmailThread | null>(null)
  
  const [replyText, setReplyText] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Handle URL callback notifications
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      toast.success('Email account connected successfully!')
      // Clear URL params
      router.replace('/inbox')
    } else if (connected === 'false') {
      toast.error(error || 'Failed to connect email account')
      router.replace('/inbox')
    }
  }, [searchParams, router])

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const res = await fetch('/api/email/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true)
    try {
      const res = await fetch('/api/email/threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingThreads(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchThreads()
  }, [fetchAccounts, fetchThreads])

  const fetchThreadDetails = useCallback(async (id: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/email/threads/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentThread(data)
        // Set all unread messages as read locally
        setThreads(prev => prev.map(t => t.id === id ? { ...t, messages: [{ ...t.messages[0], isRead: true }] } : t))
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

  const handleConnect = (provider: 'google' | 'microsoft') => {
    window.location.href = `/api/email/oauth/${provider}`
  }

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return

    try {
      const res = await fetch(`/api/email/accounts?id=${accountId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Account disconnected successfully')
        fetchAccounts()
        fetchThreads()
        if (currentThread?.emailAccount.email === accounts.find(a => a.id === accountId)?.email) {
          setSelectedThreadId(null)
        }
      } else {
        toast.error('Failed to disconnect account')
      }
    } catch (err) {
      toast.error('An error occurred while disconnecting')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/email/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Sync complete! Synced ${data.syncedCount || 0} new messages.`)
        fetchThreads()
        if (selectedThreadId) {
          fetchThreadDetails(selectedThreadId)
        }
      } else {
        toast.error(data.error || 'Failed to sync inbox')
      }
    } catch (err) {
      toast.error('An error occurred during sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThreadId) return
    setSending(true)
    try {
      const res = await fetch(`/api/email/threads/${selectedThreadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.replace(/\n/g, '<br/>') }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Reply sent successfully')
        setReplyText('')
        fetchThreadDetails(selectedThreadId)
      } else {
        toast.error(data.error || 'Failed to send reply')
      }
    } catch (err) {
      toast.error('An error occurred while sending reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Two-way Email Inbox</h1>
            <p className="text-sm text-muted-foreground">Manage connected mail accounts and review student conversations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || accounts.length === 0} className="relative overflow-hidden group">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              Sync Inbox
            </Button>
          </div>
        </div>

        {/* Workspace Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
          {/* Left Panel: Connections & Thread List (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {/* Connected Accounts Card */}
            <Card className="flex-shrink-0 border-border/80 shadow-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Mail Integrations
                </CardTitle>
                <CardDescription className="text-xs">Connect mailboxes via OAuth 2.0</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {/* Account list */}
                {loadingAccounts ? (
                  <div className="h-10 animate-pulse bg-muted rounded-md" />
                ) : accounts.length === 0 ? (
                  <div className="text-center py-2 text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-md">
                    No connected accounts. Click below to add.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {accounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/40 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium truncate text-foreground">{acc.email}</p>
                          <p className="text-[10px] text-muted-foreground">{acc.provider}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDisconnect(acc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Connect Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="outline" size="sm" className="text-xs h-8 border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20" onClick={() => handleConnect('google')}>
                    + Connect Gmail
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8 border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-950/20" onClick={() => handleConnect('microsoft')}>
                    + Connect Outlook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Threads List Card */}
            <Card className="flex-1 flex flex-col min-h-0 border-border/80 shadow-md">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                  {loadingThreads ? (
                    <div className="p-4 space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 animate-pulse bg-muted rounded-md" />
                      ))}
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <Mail className="h-8 w-8 mb-2 stroke-[1.5]" />
                      <p className="text-xs">No email threads found</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Connect an account & click sync to pull emails</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {threads.map(thread => {
                        const lastMsg = thread.messages[0]
                        const isUnread = lastMsg && !lastMsg.isRead && lastMsg.direction === 'INBOUND'
                        
                        return (
                          <div
                            key={thread.id}
                            onClick={() => setSelectedThreadId(thread.id)}
                            className={`p-3.5 cursor-pointer text-left transition-colors flex flex-col gap-1.5 ${
                              selectedThreadId === thread.id
                                ? 'bg-primary/5 border-l-2 border-primary'
                                : 'hover:bg-muted/30 border-l-2 border-transparent'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-semibold truncate flex-1 ${isUnread ? 'text-primary' : 'text-foreground'}`}>
                                {thread.seeker ? thread.seeker.fullName : extractName(lastMsg?.from || 'Unknown')}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                                {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: false })} ago
                              </span>
                            </div>
                            
                            <h4 className={`text-xs truncate ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {thread.subject}
                            </h4>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="truncate max-w-[150px]">via {thread.emailAccount.email}</span>
                              {thread.seeker && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-green-500/10 text-green-600 dark:text-green-400 border-none font-normal">
                                  Matched Student
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Selected Thread Details (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col min-h-0">
            {currentThread ? (
              <div className="flex flex-col h-full border border-border/80 rounded-lg bg-card shadow-md min-h-0">
                {/* Thread Header */}
                <div className="p-4 border-b border-border/60 flex items-center justify-between flex-shrink-0 bg-muted/10">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold truncate text-foreground">{currentThread.subject}</h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Matched Seeker:</span>
                      {currentThread.seeker ? (
                        <a
                          href={`/seekers/${currentThread.seeker.id}`}
                          className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {currentThread.seeker.fullName}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 italic">Unmatched</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {currentThread.emailAccount.provider} account
                  </Badge>
                </div>

                {/* Message History List */}
                <ScrollArea className="flex-1 min-h-0 p-4">
                  {loadingMessages ? (
                    <div className="space-y-4 py-8">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-28 animate-pulse bg-muted rounded-md w-3/4" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentThread.messages.map((message) => {
                        const isOutbound = message.direction === 'OUTBOUND'
                        return (
                          <div
                            key={message.id}
                            className={`flex flex-col max-w-[85%] rounded-lg p-3.5 border ${
                              isOutbound
                                ? 'bg-primary/5 border-primary/20 ml-auto'
                                : 'bg-muted/20 border-border/60 mr-auto'
                            }`}
                          >
                            {/* Message Header */}
                            <div className="flex justify-between items-center gap-4 mb-2 pb-1.5 border-b border-border/30 text-[10px] text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {isOutbound ? 'You' : extractName(message.from)} ({message.from})
                              </span>
                              <span>{new Date(message.sentAt).toLocaleString()}</span>
                            </div>

                            {/* Message Body */}
                            <div
                              className="text-xs leading-relaxed break-words whitespace-pre-line text-foreground"
                              dangerouslySetInnerHTML={{ __html: cleanBody(message.body) }}
                            />

                            {/* Sent / Open Status tracking */}
                            {isOutbound && (
                              <div className="flex justify-end items-center gap-1.5 mt-2.5 pt-1.5 border-t border-border/30 text-[10px] text-muted-foreground">
                                {message.openCount > 0 ? (
                                  <>
                                    <Eye className="h-3 w-3 text-green-500" />
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      Opened {message.openCount}x
                                    </span>
                                    {message.lastOpenedAt && (
                                      <span>(Last: {formatDistanceToNow(new Date(message.lastOpenedAt))} ago)</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="h-3 w-3 text-muted-foreground" />
                                    <span>Sent (Unread)</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Compose Reply Section */}
                <div className="p-4 border-t border-border/60 bg-muted/10 flex-shrink-0">
                  <div className="space-y-3">
                    <Textarea
                      placeholder={`Reply to ${currentThread.seeker ? currentThread.seeker.fullName : 'this conversation'}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      className="resize-none text-xs"
                      disabled={sending}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={sending || !replyText.trim()}
                        onClick={handleSendReply}
                        className="h-8 text-xs font-semibold px-4"
                      >
                        {sending ? 'Sending...' : 'Send Reply'}
                        <Send className="h-3.5 w-3.5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border border-border/80 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card/40">
                <Mail className="h-12 w-12 text-muted-foreground mb-3 stroke-[1.2]" />
                <h3 className="text-sm font-semibold">No Conversation Selected</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Select an email thread from the sidebar to view full thread messages, track open history, or reply directly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

import { Suspense } from 'react'

export default function InboxPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-sm text-muted-foreground animate-pulse">Loading Inbox...</p>
        </div>
      </DashboardLayout>
    }>
      <InboxPageContent />
    </Suspense>
  )
}

// Helpers
function extractName(emailHeader: string): string {
  const match = emailHeader.match(/^([^<]+)/)
  if (match) {
    return match[1].replace(/["']/g, '').trim()
  }
  return emailHeader
}

// Remove trailing pixel tracking tags from viewable body
function cleanBody(body: string): string {
  if (!body) return ''
  // Strip out any image tracking pixels we appended, keeping it clean
  return body.replace(/<img[^>]+track\/open[^>]+>/gi, '')
}
