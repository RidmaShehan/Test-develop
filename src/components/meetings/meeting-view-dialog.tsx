'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, User, FileText, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Video, Phone, ExternalLink, Copy } from 'lucide-react'
import { format } from 'date-fns'

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

interface MeetingViewDialogProps {
  meeting: Meeting
  onClose: () => void
  onEdit: (meeting: Meeting) => void
  onDelete: (meetingId: string) => void
}

export function MeetingViewDialog({ meeting, onClose, onEdit, onDelete }: MeetingViewDialogProps) {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      onDelete(meeting.id)
      onClose()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] sm:w-full">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">{meeting.title}</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              {meeting.meetingType && (
                <Badge className={`${getMeetingTypeColor(meeting.meetingType)} flex items-center gap-1`}>
                  {getMeetingTypeIcon(meeting.meetingType)}
                  {meeting.meetingType.replace('_', ' ')}
                </Badge>
              )}
              <Badge className={`${getStatusColor(meeting.status)} flex items-center gap-1`}>
                {getStatusIcon(meeting.status)}
                {meeting.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(meeting.startTime), 'EEEE, MMMM dd, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                </p>
              </div>
            </div>

            {meeting.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{meeting.location}</p>
                </div>
              </div>
            )}

            {meeting.meetingLink && (
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Meeting Link</p>
                  <div className="flex items-center gap-2">
                    <a 
                      href={meeting.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      {meeting.meetingLink}
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(meeting.meetingLink!)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {meeting.meetingId && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    ID
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Meeting ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground font-mono">{meeting.meetingId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(meeting.meetingId!)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {meeting.meetingPassword && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    PW
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Meeting Password</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground font-mono">{meeting.meetingPassword}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(meeting.meetingPassword!)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Assigned To</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.assignedTo.name} ({meeting.assignedTo.email})
                </p>
              </div>
            </div>


            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.createdBy.name} ({meeting.createdBy.email})
                </p>
              </div>
            </div>
          </div>

          {/* Agenda */}
          {meeting.agenda && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Meeting Agenda</h3>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {meeting.agenda}
                </p>
              </div>
            </div>
          )}

          {/* Additional Attendees */}
          {meeting.attendees && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Additional Attendees</h3>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {meeting.attendees.split(/[,\n]/).map((email, index) => (
                    <span key={index} className="block">
                      {email.trim()}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {meeting.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Description</h3>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {meeting.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {meeting.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Notes</h3>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {meeting.notes}
              </p>
            </div>
          )}

          {/* Meeting Duration */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const start = new Date(meeting.startTime)
                const end = new Date(meeting.endTime)
                const durationMs = end.getTime() - start.getTime()
                const hours = Math.floor(durationMs / (1000 * 60 * 60))
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
                
                if (hours > 0 && minutes > 0) {
                  return `${hours}h ${minutes}m`
                } else if (hours > 0) {
                  return `${hours}h`
                } else {
                  return `${minutes}m`
                }
              })()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {meeting.meetingLink && (
              <Button
                variant="default"
                onClick={() => window.open(meeting.meetingLink, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 w-full sm:w-auto"
              >
                <ExternalLink className="h-4 w-4" />
                Join Meeting
              </Button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onEdit(meeting)
                onClose()
              }}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
