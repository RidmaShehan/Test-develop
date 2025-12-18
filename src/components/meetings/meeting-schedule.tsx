'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, MapPin, User, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Video, Phone, ExternalLink } from 'lucide-react'
import { MeetingForm } from './meeting-form'
import { MeetingViewDialog } from './meeting-view-dialog'
import { format } from 'date-fns'
import { useNotification } from '@/hooks/use-notification'

interface Meeting {
  id: string
  title: string
  description?: string
  location?: string
  notes?: string
  startTime: string
  endTime: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  assignedToId: string
  meetingType?: string
  meetingLink?: string
  meetingId?: string
  meetingPassword?: string
  agenda?: string
  attendees?: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo: {
    id: string
    name: string
    email: string
  }
  seeker?: {
    id: string
    fullName: string
    phone: string
    email?: string
  }
}

interface User {
  id: string
  name: string
  email: string
}


export function MeetingSchedule() {
  const notify = useNotification()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [meetingsRes, usersRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/users/basic')
      ])

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json()
        setMeetings(meetingsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMeeting = () => {
    setEditingMeeting(null)
    setShowForm(true)
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    setShowForm(true)
  }

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setShowViewDialog(true)
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMeetings(meetings.filter(m => m.id !== meetingId))
        notify.success('Meeting Deleted', 'The meeting has been successfully deleted.')
      } else {
        const error = await response.json()
        notify.error('Delete Failed', error.error || 'Failed to delete meeting')
      }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      notify.error('Delete Failed', 'Failed to delete meeting')
    }
  }

  const handleFormSubmit = async (meetingData: any) => {
    try {
      const url = editingMeeting ? `/api/meetings/${editingMeeting.id}` : '/api/meetings'
      const method = editingMeeting ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      })

      if (response.ok) {
        const updatedMeeting = await response.json()
        
        if (editingMeeting) {
          setMeetings(meetings.map(m => m.id === editingMeeting.id ? updatedMeeting : m))
          notify.success('Meeting Updated', 'The meeting has been successfully updated.')
        } else {
          setMeetings([...meetings, updatedMeeting])
          notify.success('Meeting Scheduled', 'The meeting has been successfully scheduled.')
        }
        
        setShowForm(false)
        setEditingMeeting(null)
      } else {
        const error = await response.json()
        notify.error('Save Failed', error.error || 'Failed to save meeting')
      }
    } catch (error) {
      console.error('Error saving meeting:', error)
      notify.error('Save Failed', 'Failed to save meeting')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'RESCHEDULED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      case 'RESCHEDULED':
        return <Calendar className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getMeetingTypeIcon = (meetingType: string) => {
    switch (meetingType) {
      case 'ZOOM':
      case 'GOOGLE_MEET':
      case 'MICROSOFT_TEAMS':
        return <Video className="h-4 w-4" />
      case 'PHONE_CALL':
        return <Phone className="h-4 w-4" />
      case 'IN_PERSON':
        return <MapPin className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getMeetingTypeColor = (meetingType: string) => {
    switch (meetingType) {
      case 'ZOOM':
        return 'bg-blue-100 text-blue-800'
      case 'GOOGLE_MEET':
        return 'bg-green-100 text-green-800'
      case 'MICROSOFT_TEAMS':
        return 'bg-purple-100 text-purple-800'
      case 'PHONE_CALL':
        return 'bg-orange-100 text-orange-800'
      case 'IN_PERSON':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const todayMeetings = meetings.filter(meeting => {
    const today = new Date()
    const meetingDate = new Date(meeting.startTime)
    return meetingDate.toDateString() === today.toDateString()
  })

  const upcomingMeetings = meetings.filter(meeting => {
    const today = new Date()
    const meetingDate = new Date(meeting.startTime)
    return meetingDate > today && meeting.status === 'SCHEDULED'
  })

  const pastMeetings = meetings.filter(meeting => {
    const today = new Date()
    const meetingDate = new Date(meeting.startTime)
    return meetingDate < today || meeting.status === 'COMPLETED'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Meetings</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your scheduled meetings
          </p>
        </div>
        <Button 
          onClick={handleCreateMeeting} 
          className="flex items-center gap-2 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Schedule Meeting</span>
          <span className="sm:hidden">New Meeting</span>
        </Button>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="today" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <span className="hidden sm:inline">Today</span>
            <span className="sm:hidden">Today</span>
            <span className="ml-1.5 sm:ml-2">({todayMeetings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <span className="hidden sm:inline">Upcoming</span>
            <span className="sm:hidden">Upcoming</span>
            <span className="ml-1.5 sm:ml-2">({upcomingMeetings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <span className="hidden sm:inline">Past</span>
            <span className="sm:hidden">Past</span>
            <span className="ml-1.5 sm:ml-2">({pastMeetings.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <MeetingList 
            meetings={todayMeetings}
            onView={handleViewMeeting}
            onEdit={handleEditMeeting}
            onDelete={handleDeleteMeeting}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getMeetingTypeIcon={getMeetingTypeIcon}
            getMeetingTypeColor={getMeetingTypeColor}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <MeetingList 
            meetings={upcomingMeetings}
            onView={handleViewMeeting}
            onEdit={handleEditMeeting}
            onDelete={handleDeleteMeeting}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getMeetingTypeIcon={getMeetingTypeIcon}
            getMeetingTypeColor={getMeetingTypeColor}
          />
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <MeetingList 
            meetings={pastMeetings}
            onView={handleViewMeeting}
            onEdit={handleEditMeeting}
            onDelete={handleDeleteMeeting}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getMeetingTypeIcon={getMeetingTypeIcon}
            getMeetingTypeColor={getMeetingTypeColor}
          />
        </TabsContent>
      </Tabs>

      {showForm && (
        <MeetingForm
          meeting={editingMeeting}
          users={users}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false)
            setEditingMeeting(null)
          }}
        />
      )}

      {showViewDialog && selectedMeeting && (
        <MeetingViewDialog
          meeting={selectedMeeting}
          onClose={() => {
            setShowViewDialog(false)
            setSelectedMeeting(null)
          }}
          onEdit={handleEditMeeting}
          onDelete={handleDeleteMeeting}
        />
      )}
    </div>
  )
}

interface MeetingListProps {
  meetings: Meeting[]
  onView: (meeting: Meeting) => void
  onEdit: (meeting: Meeting) => void
  onDelete: (meetingId: string) => void
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
  getMeetingTypeIcon: (meetingType: string) => React.ReactNode
  getMeetingTypeColor: (meetingType: string) => string
}

function MeetingList({ meetings, onView, onEdit, onDelete, getStatusColor, getStatusIcon, getMeetingTypeIcon, getMeetingTypeColor }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">No meetings found</p>
          <p className="text-xs text-muted-foreground">Schedule a new meeting to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="hover:shadow-md transition-all duration-200 border-gray-200 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Main Content */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title and Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">{meeting.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${getStatusColor(meeting.status)} flex items-center gap-1 text-xs font-medium px-2 py-0.5`}>
                      {getStatusIcon(meeting.status)}
                      <span className="hidden sm:inline">{meeting.status.replace('_', ' ')}</span>
                      <span className="sm:hidden">{meeting.status.split('_')[0]}</span>
                    </Badge>
                    {meeting.meetingType && (
                      <Badge className={`${getMeetingTypeColor(meeting.meetingType)} flex items-center gap-1 text-xs font-medium px-2 py-0.5`}>
                        {getMeetingTypeIcon(meeting.meetingType)}
                        <span className="hidden sm:inline">{meeting.meetingType.replace('_', ' ')}</span>
                        <span className="sm:hidden">{meeting.meetingType.split('_')[0]}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Meeting Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      <span className="hidden sm:inline">{format(new Date(meeting.startTime), 'MMM dd, yyyy - h:mm a')}</span>
                      <span className="sm:hidden">{format(new Date(meeting.startTime), 'MMM dd - h:mm a')}</span>
                      {' - '}
                      {format(new Date(meeting.endTime), 'h:mm a')}
                    </span>
                  </div>
                  
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{meeting.location}</span>
                    </div>
                  )}

                  {meeting.meetingLink && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a 
                        href={meeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline truncate"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}

                  {meeting.meetingId && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                        ID: {meeting.meetingId}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      <span className="hidden sm:inline">Assigned to: </span>
                      {meeting.assignedTo.name}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {meeting.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {meeting.description}
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-row sm:flex-col items-center gap-2 sm:ml-4 sm:flex-shrink-0">
                {meeting.meetingLink && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(meeting.meetingLink, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm flex-1 sm:flex-initial w-full sm:w-auto"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Join</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(meeting)}
                  className="flex-1 sm:flex-initial w-full sm:w-auto text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">View</span>
                  <span className="sm:hidden">View</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(meeting)}
                  className="flex-1 sm:flex-initial w-full sm:w-auto"
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(meeting.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-initial w-full sm:w-auto"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
