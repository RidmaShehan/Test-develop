'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, Shield, Users, Phone } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    interactions: number
    followUpTasks: number
    assignedSeekers: number
    userRoles: number
  }
  userRoles: Array<{
    id: string
    role: {
      id: string
      name: string
      description: string | null
    }
  }>
}

interface DeleteUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserDeleted?: () => void
}

export function DeleteUserDialog({ user, open, onOpenChange, onUserDeleted }: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!user) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      onOpenChange(false)
      onUserDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
      console.error('Error deleting user:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />
      case 'MARKETING':
        return <Phone className="h-4 w-4" />
      case 'COORDINATOR':
      case 'MANAGER':
      case 'VIEWER':
        return <Users className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              {getRoleIcon(user.role)}
              <div>
                <h4 className="font-medium text-gray-900">{user.name}</h4>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interactions:</span>
                <span className="font-medium">{user._count.interactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tasks:</span>
                <span className="font-medium">{user._count.followUpTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assigned Seekers:</span>
                <span className="font-medium">{user._count.assignedSeekers}</span>
              </div>
            </div>

            {(user._count.interactions > 0 || user._count.followUpTasks > 0 || user._count.assignedSeekers > 0) && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ This user has active data (interactions, tasks, or assigned seekers). 
                  Consider reassigning or archiving this data before deletion.
                </p>
              </div>
            )}

            {(user.role === 'ADMIN' || user.role === 'ADMINISTRATOR' || user.role === 'DEVELOPER') && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  🚨 Warning: This is an admin user. Deleting this user may affect system access.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
