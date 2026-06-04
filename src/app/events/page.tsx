'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays, Plus, Users, MapPin, Link as LinkIcon, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_LABELS: Record<string, string> = {
  OPEN_DAY: 'Open Day', EXHIBITION: 'Exhibition', SEMINAR: 'Seminar',
  WEBINAR: 'Webinar', WORKSHOP: 'Workshop', OTHER: 'Other',
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800 border-blue-200',
  ONGOING: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [registrationsOpen, setRegistrationsOpen] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', type: 'OPEN_DAY',
    startAt: '', endAt: '', venue: '', onlineLink: '',
    maxAttendees: '', imageUrl: '',
  })

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      if (data.success) setEvents(data.data)
    } catch { toast.error('Failed to load events') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchEvents() }, [])

  const createEvent = async () => {
    if (!form.title || !form.type || !form.startAt || !form.endAt) {
      toast.error('Title, type, start and end times are required')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Event created')
        setNewEventOpen(false)
        setForm({ title: '', description: '', type: 'OPEN_DAY', startAt: '', endAt: '', venue: '', onlineLink: '', maxAttendees: '', imageUrl: '' })
        fetchEvents()
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed to create event') }
    finally { setIsSubmitting(false) }
  }

  const changeStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) { toast.success('Status updated'); fetchEvents() }
    else toast.error(data.error || 'Failed')
  }

  const viewRegistrations = async (event: any) => {
    const res = await fetch(`/api/events/${event.id}`)
    const data = await res.json()
    if (data.success) setRegistrationsOpen(data.data)
  }

  const checkIn = async (eventId: string, registrationId: string) => {
    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, attended: true }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Checked in')
      viewRegistrations({ id: eventId })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Events</h1>
            <p className="text-sm text-gray-600">Manage open days, exhibitions, seminars and more</p>
          </div>
          <Button onClick={() => setNewEventOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />New Event
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
            <p>No events yet. Create your first event!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="w-full h-32 object-cover" />}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{event.title}</h3>
                    <Badge className={cn('text-xs border flex-shrink-0', STATUS_COLORS[event.status] ?? 'bg-slate-100')}>{event.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs border-0">
                      {TYPE_LABELS[event.type] ?? event.type}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.startAt), 'dd MMM yyyy, HH:mm')}
                    </div>
                    {event.venue && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{event.venue}</div>}
                    {event.onlineLink && <div className="flex items-center gap-1.5"><LinkIcon className="w-3 h-3" />Online</div>}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => viewRegistrations(event)}>
                      <Users className="w-3 h-3 mr-1" />{event._count?.registrations ?? 0} Registered
                    </Button>
                    {event.status === 'UPCOMING' && (
                      <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => changeStatus(event.id, 'ONGOING')}>
                        Start
                      </Button>
                    )}
                    {event.status === 'ONGOING' && (
                      <Button size="sm" className="h-7 text-xs" onClick={() => changeStatus(event.id, 'COMPLETED')}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Event Dialog */}
        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Open Day 2026" />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start *</Label>
                  <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End *</Label>
                  <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Venue</Label>
                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Main Campus, Colombo" />
              </div>
              <div className="space-y-1.5">
                <Label>Online Link</Label>
                <Input value={form.onlineLink} onChange={(e) => setForm({ ...form, onlineLink: e.target.value })} placeholder="https://meet.google.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Max Attendees</Label>
                <Input type="number" value={form.maxAttendees} onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })} placeholder="Leave empty for unlimited" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Event description..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewEventOpen(false)}>Cancel</Button>
              <Button onClick={createEvent} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Event'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Registrations Dialog */}
        <Dialog open={!!registrationsOpen} onOpenChange={(o) => !o && setRegistrationsOpen(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrations — {registrationsOpen?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {registrationsOpen?.registrations?.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No registrations yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                    <tr>
                      {['Name', 'Email', 'Phone', 'Attended'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {registrationsOpen?.registrations?.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2 font-medium text-sm">{reg.name}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{reg.email}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{reg.phone || '—'}</td>
                        <td className="px-3 py-2">
                          {reg.attended ? (
                            <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Attended</Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => checkIn(registrationsOpen.id, reg.id)}>
                              Check in
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
