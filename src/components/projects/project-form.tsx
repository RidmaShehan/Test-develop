'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, X, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/contexts/notification-context'

interface User {
  id: string
  name: string
  email: string
}

interface ProjectFormProps {
  project?: any
  onSave: (projectData: any) => void
  onCancel: () => void
  loading?: boolean
}

export function ProjectForm({ project, onSave, onCancel, loading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    budget: '',
    color: '#3b82f6'
  })
  
  const [users, setUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchUsers()
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'ACTIVE',
        priority: project.priority || 'MEDIUM',
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        budget: project.budget?.toString() || '',
        color: project.color || '#3b82f6'
      })
      if (project.members) {
        setSelectedMembers(project.members.map((m: any) => m.user))
      }
    }
  }, [project])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/basic')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }))
  }

  const addMember = (user: User) => {
    if (!selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(prev => [...prev, user])
    }
  }

  const removeMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (formData.budget && (isNaN(Number(formData.budget)) || Number(formData.budget) < 0)) {
      newErrors.budget = 'Budget must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const projectData = {
      ...formData,
      budget: formData.budget ? Number(formData.budget) : null,
      startDate: formData.startDate?.toISOString(),
      endDate: formData.endDate?.toISOString(),
      memberIds: selectedMembers.map(m => m.id)
    }

    // Send notification for project creation/update
    if (project) {
      addNotification({
        title: 'Project Updated',
        message: `Project "${projectData.name}" has been updated`,
        type: 'success',
        actionUrl: `/projects?project=${project.id}`,
        actionText: 'View Project',
        entityType: 'project',
        entityId: project.id
      })
    } else {
      addNotification({
        title: 'Project Created',
        message: `Project "${projectData.name}" has been created`,
        type: 'success',
        actionUrl: `/projects`,
        actionText: 'View Projects',
        entityType: 'project'
      })
    }

    onSave(projectData)
  }

  const availableUsers = users.filter(user => !selectedMembers.find(m => m.id === user.id))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter project name"
            className={cn(errors.name && 'border-red-500')}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter project description"
            rows={3}
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANNING">Planning</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div>
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => handleDateChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div>
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => handleDateChange('endDate', date)}
                disabled={(date) => formData.startDate ? date < formData.startDate : false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>}
        </div>

        {/* Budget */}
        <div>
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            placeholder="Enter budget amount"
            className={cn(errors.budget && 'border-red-500')}
          />
          {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
        </div>

        {/* Color */}
        <div>
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div>
        <Label>Team Members</Label>
        <div className="space-y-3">
          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                  {member.name}
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Member Dropdown */}
          {availableUsers.length > 0 && (
            <div>
              <Select onValueChange={(userId) => {
                const user = users.find(u => u.id === userId)
                if (user) addMember(user)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Add team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  )
}
