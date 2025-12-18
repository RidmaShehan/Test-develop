'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, MapPin, User, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useNotification } from '@/hooks/use-notification'

interface Meeting {
  id: string
  title: string
  description?: string
  location?: string
  notes?: string
  startTime: string
  endTime: string
  status: string
  assignedToId: string
  meetingType?: string
  meetingLink?: string
  meetingId?: string
  meetingPassword?: string
  agenda?: string
  attendees?: string
}

interface User {
  id: string
  name: string
  email: string
}

interface MeetingFormProps {
  meeting?: Meeting | null
  users: User[]
  onSubmit: (data: any) => void
  onClose: () => void
}

export function MeetingForm({ meeting, users, onSubmit, onClose }: MeetingFormProps) {
  const notify = useNotification()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    notes: '',
    startTime: '',
    endTime: '',
    assignedToId: '',
    status: 'SCHEDULED',
    meetingType: 'IN_PERSON',
    meetingLink: '',
    meetingId: '',
    meetingPassword: '',
    agenda: '',
    attendees: '',
    reminderMinutes: '15'
  })

  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (meeting) {
      const start = new Date(meeting.startTime)
      const end = new Date(meeting.endTime)
      
      setFormData({
        title: meeting.title,
        description: meeting.description || '',
        location: meeting.location || '',
        notes: meeting.notes || '',
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        assignedToId: meeting.assignedToId,
        status: meeting.status,
        meetingType: meeting.meetingType || 'IN_PERSON',
        meetingLink: meeting.meetingLink || '',
        meetingId: meeting.meetingId || '',
        meetingPassword: meeting.meetingPassword || '',
        agenda: meeting.agenda || '',
        attendees: meeting.attendees || '',
        reminderMinutes: '15'
      })
      
      setStartDate(start)
      setEndDate(end)
      setStartTime(format(start, 'HH:mm'))
      setEndTime(format(end, 'HH:mm'))
    }
  }, [meeting])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (date) {
      if (type === 'start') {
        setStartDate(date)
        // Combine with existing time if available
        if (startTime) {
          const [hours, minutes] = startTime.split(':')
          const newDateTime = new Date(date)
          newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          setFormData(prev => ({ ...prev, startTime: newDateTime.toISOString() }))
        } else {
          // Set default time to 9:00 AM if no time is set
          const newDateTime = new Date(date)
          newDateTime.setHours(9, 0, 0, 0)
          setStartTime('09:00')
          setFormData(prev => ({ ...prev, startTime: newDateTime.toISOString() }))
        }
      } else {
        setEndDate(date)
        // Combine with existing time if available
        if (endTime) {
          const [hours, minutes] = endTime.split(':')
          const newDateTime = new Date(date)
          newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          setFormData(prev => ({ ...prev, endTime: newDateTime.toISOString() }))
        } else {
          // Set default time to 10:00 AM if no time is set
          const newDateTime = new Date(date)
          newDateTime.setHours(10, 0, 0, 0)
          setEndTime('10:00')
          setFormData(prev => ({ ...prev, endTime: newDateTime.toISOString() }))
        }
      }
    }
  }

  const handleTimeChange = (time: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartTime(time)
      if (startDate) {
        const [hours, minutes] = time.split(':')
        const newDateTime = new Date(startDate)
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        setFormData(prev => ({ ...prev, startTime: newDateTime.toISOString() }))
        
        // Auto-set end time to 1 hour later if not already set
        if (!endTime) {
          const endDateTime = new Date(newDateTime)
          endDateTime.setHours(endDateTime.getHours() + 1)
          const endTimeString = endDateTime.toTimeString().slice(0, 5)
          setEndTime(endTimeString)
          if (endDate) {
            const [endHours, endMinutes] = endTimeString.split(':')
            const newEndDateTime = new Date(endDate)
            newEndDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)
            setFormData(prev => ({ ...prev, endTime: newEndDateTime.toISOString() }))
          }
        }
      }
    } else {
      setEndTime(time)
      if (endDate) {
        const [hours, minutes] = time.split(':')
        const newDateTime = new Date(endDate)
        newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        setFormData(prev => ({ ...prev, endTime: newDateTime.toISOString() }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.assignedToId) {
      newErrors.assignedToId = 'Assigned user is required'
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (!endTime) {
      newErrors.endTime = 'End time is required'
    }

    // Validate that end date/time is after start date/time
    if (startDate && endDate && startTime && endTime) {
      const startDateTime = new Date(startDate)
      const [startHours, startMinutes] = startTime.split(':')
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)

      const endDateTime = new Date(endDate)
      const [endHours, endMinutes] = endTime.split(':')
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

      if (endDateTime <= startDateTime) {
        if (startDate.getTime() === endDate.getTime()) {
          newErrors.endTime = 'End time must be after start time'
        } else {
          newErrors.endDate = 'End date and time must be after start date and time'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Ensure we have properly formatted datetime strings
    const submitData = { ...formData }
    
    if (startDate && startTime) {
      const [hours, minutes] = startTime.split(':')
      const startDateTime = new Date(startDate)
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      submitData.startTime = startDateTime.toISOString()
    }
    
    if (endDate && endTime) {
      const [hours, minutes] = endTime.split(':')
      const endDateTime = new Date(endDate)
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      submitData.endTime = endDateTime.toISOString()
    }

    onSubmit(submitData)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Meeting title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assign To *</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) => handleInputChange('assignedToId', value)}
              >
                <SelectTrigger className={errors.assignedToId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedToId && (
                <p className="text-sm text-red-500">{errors.assignedToId}</p>
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                      errors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => handleDateChange(date, 'start')}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleTimeChange(e.target.value, 'start')}
                  className={errors.startTime ? 'border-red-500' : ''}
                  placeholder="Select start time"
                />
              </div>
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                      errors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => handleDateChange(date, 'end')}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date(new Date().setHours(0, 0, 0, 0))
                      const startDateOnly = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : today
                      return date < startDateOnly
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Time *</Label>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(e.target.value, 'end')}
                  className={errors.endTime ? 'border-red-500' : ''}
                  placeholder="Select end time"
                />
              </div>
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingType">Meeting Type *</Label>
            <Select
              value={formData.meetingType}
              onValueChange={(value) => handleInputChange('meetingType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PERSON">In-Person</SelectItem>
                <SelectItem value="ZOOM">Zoom</SelectItem>
                <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                <SelectItem value="MICROSOFT_TEAMS">Microsoft Teams</SelectItem>
                <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.meetingType === 'IN_PERSON' && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Meeting location"
                />
              </div>
            </div>
          )}

          {(formData.meetingType === 'ZOOM' || formData.meetingType === 'GOOGLE_MEET' || formData.meetingType === 'MICROSOFT_TEAMS') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  value={formData.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  placeholder={`${formData.meetingType === 'ZOOM' ? 'https://zoom.us/j/' : formData.meetingType === 'GOOGLE_MEET' ? 'https://meet.google.com/' : 'https://teams.microsoft.com/'}...`}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meetingId">Meeting ID</Label>
                  <Input
                    id="meetingId"
                    value={formData.meetingId}
                    onChange={(e) => handleInputChange('meetingId', e.target.value)}
                    placeholder="Meeting ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meetingPassword">Password</Label>
                  <Input
                    id="meetingPassword"
                    value={formData.meetingPassword}
                    onChange={(e) => handleInputChange('meetingPassword', e.target.value)}
                    placeholder="Meeting password (if required)"
                    type="password"
                  />
                </div>
              </div>
            </>
          )}

          {formData.meetingType === 'PHONE_CALL' && (
            <div className="space-y-2">
              <Label htmlFor="location">Phone Number</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Phone number or call details"
                />
              </div>
            </div>
          )}

          {formData.meetingType === 'OTHER' && (
            <div className="space-y-2">
              <Label htmlFor="location">Meeting Details</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Meeting details or instructions"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="agenda">Meeting Agenda</Label>
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-2" />
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                placeholder="Meeting agenda and topics to discuss"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendees">Additional Attendees</Label>
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 text-muted-foreground mt-2" />
              <Textarea
                id="attendees"
                value={formData.attendees}
                onChange={(e) => handleInputChange('attendees', e.target.value)}
                placeholder="Enter email addresses of additional attendees (one per line)"
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter email addresses separated by commas or new lines
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderMinutes">Reminder</Label>
            <Select
              value={formData.reminderMinutes}
              onValueChange={(value) => handleInputChange('reminderMinutes', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reminder time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes before</SelectItem>
                <SelectItem value="15">15 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
                <SelectItem value="0">No reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-2" />
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Meeting description"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          {meeting && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {meeting ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
