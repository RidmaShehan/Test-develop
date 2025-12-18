'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, Shield, Key } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    permissions: number
  }
  permissions: Array<{
    id: string
    name: string
    description?: string | null
    permission?: {
      id: string
      name: string
      description: string | null
    }
  }>
}

interface DeleteRoleDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleDeleted?: () => void
}

export function DeleteRoleDialog({ role, open, onOpenChange, onRoleDeleted }: DeleteRoleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!role) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete role')
      }

      toast.success('Role deleted successfully')
      onOpenChange(false)
      onRoleDeleted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role')
      console.error('Error deleting role:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this role? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">{role.name}</h4>
                <p className="text-sm text-gray-600">
                  {role.description || 'No description provided'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${role.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Users assigned:</span>
                <span className="font-medium">{role._count.users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Permissions:</span>
                <span className="font-medium">{role._count.permissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(role.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {role._count.users > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ This role is assigned to {role._count.users} user(s). 
                  Deleting this role will remove it from all users.
                </p>
              </div>
            )}

            {role._count.permissions > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Permissions included:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {role.permissions.slice(0, 6).map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-1">
                        <Key className="h-3 w-3" />
                        <span>{permission.permission?.name || permission.name}</span>
                      </div>
                    ))}
                    {role.permissions.length > 6 && (
                      <div className="col-span-2 text-gray-600">
                        ... and {role.permissions.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
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
            {isDeleting ? 'Deleting...' : 'Delete Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
