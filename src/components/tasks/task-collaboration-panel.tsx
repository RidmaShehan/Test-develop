'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, Clock3, MessageSquare, Plus, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

type Checklist = { id: string; title: string; completed: boolean }
type Comment = { id: string; content: string; createdAt: string; author: { name: string } }
type TimeEntry = { id: string; description?: string | null; startTime: string; endTime?: string | null; duration?: number | null; user: { name: string } }

export function TaskCollaborationPanel({ taskId }: { taskId: string }) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [trackedMinutes, setTrackedMinutes] = useState(0)
  const [projectRole, setProjectRole] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [checklistTitle, setChecklistTitle] = useState('')
  const [timeDescription, setTimeDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/enhanced/${taskId}/collaboration`)
      if (!response.ok) throw new Error('Could not load task collaboration')
      const data = await response.json()
      setChecklists(data.checklists)
      setComments(data.comments)
      setTimeEntries(data.timeEntries)
      setTrackedMinutes(data.trackedMinutes)
      setProjectRole(data.projectRole)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load task collaboration')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { void load() }, [load])

  const request = async (body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/tasks/enhanced/${taskId}/collaboration`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save changes')
      await load()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save changes')
      return false
    } finally { setSaving(false) }
  }

  const completedCount = checklists.filter((item) => item.completed).length
  const duration = useMemo(() => {
    const hours = Math.floor(trackedMinutes / 60)
    const minutes = trackedMinutes % 60
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`
  }, [trackedMinutes])

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Loading collaboration…</div>

  return <Card className="w-full">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center justify-between text-base sm:text-lg">
        Collaboration
        <Badge variant="secondary">{completedCount}/{checklists.length} checklist · {duration} logged</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="comments">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4" />Comments</TabsTrigger>
          <TabsTrigger value="checklist"><CheckCircle2 className="mr-2 h-4 w-4" />Checklist</TabsTrigger>
          <TabsTrigger value="time"><Clock3 className="mr-2 h-4 w-4" />Time</TabsTrigger>
        </TabsList>
        <TabsContent value="comments" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={projectRole === 'VIEWER' ? "Viewers cannot post comments." : "Write an update for the team…"} disabled={projectRole === 'VIEWER'} />
            <Button disabled={saving || !comment.trim() || projectRole === 'VIEWER'} onClick={async () => { if (await request({ action: 'comment', content: comment })) setComment('') }}>
              <Send className="mr-2 h-4 w-4" />Post comment
            </Button>
          </div>
          <div className="space-y-3 border-t pt-3">
            {comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : comments.map((item) => <div key={item.id} className="rounded-lg bg-muted/50 p-3">
              <div className="mb-1 flex justify-between gap-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">{item.author.name}</span><span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span></div>
              <p className="whitespace-pre-wrap text-sm">{item.content}</p>
            </div>)}
          </div>
        </TabsContent>
        <TabsContent value="checklist" className="space-y-3 pt-3">
          <div className="flex gap-2">
            <Input value={checklistTitle} onChange={(event) => setChecklistTitle(event.target.value)} placeholder={projectRole === 'VIEWER' ? "Viewers cannot add items" : "Add a checklist item"} disabled={projectRole === 'VIEWER'} />
            <Button size="icon" disabled={saving || !checklistTitle.trim() || projectRole === 'VIEWER'} onClick={async () => { if (await request({ action: 'checklist', title: checklistTitle })) setChecklistTitle('') }}><Plus className="h-4 w-4" /></Button>
          </div>
          {checklists.length === 0 ? <p className="text-sm text-muted-foreground">No checklist items yet.</p> : checklists.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
              <Checkbox checked={item.completed} disabled={projectRole === 'VIEWER'} onCheckedChange={async (checked) => {
                const response = await fetch(`/api/tasks/enhanced/${taskId}/collaboration`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'checklist', checklistId: item.id, completed: checked === true }) })
                if (!response.ok) toast.error('Could not update checklist item'); else void load()
              }} />
              <span className={item.completed ? 'text-muted-foreground line-through' : ''}>{item.title}</span>
            </label>
          ))}
        </TabsContent>
        <TabsContent value="time" className="space-y-3 pt-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={projectRole === 'VIEWER'} />
            <Input type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={projectRole === 'VIEWER'} />
            <Input value={timeDescription} onChange={(event) => setTimeDescription(event.target.value)} placeholder={projectRole === 'VIEWER' ? "Viewers cannot log time" : "What did you work on?"} disabled={projectRole === 'VIEWER'} />
          </div>
          <Button disabled={saving || !startTime || projectRole === 'VIEWER'} onClick={async () => { if (await request({ action: 'time-entry', startTime, endTime: endTime || undefined, description: timeDescription })) { setStartTime(''); setEndTime(''); setTimeDescription('') } }}><Clock3 className="mr-2 h-4 w-4" />Log time</Button>
          <div className="space-y-2 border-t pt-3">{timeEntries.length === 0 ? <p className="text-sm text-muted-foreground">No time logged yet.</p> : timeEntries.map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm"><div><p className="font-medium">{entry.user.name}</p><p className="text-muted-foreground">{entry.description || 'Time entry'} · {new Date(entry.startTime).toLocaleString()}</p></div><Badge variant="secondary">{entry.duration ?? 0} min</Badge></div>)}</div>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
}
