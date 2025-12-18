'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface Permission {
  id: string
  name: string
  description: string | null
}

interface Role {
  id: string
  name: string
  description: string | null
  isActive: boolean
  permissions: Array<{
    id: string
    name: string
    description?: string | null
    permission?: {
      id: string
      name: string
    }
  }>
}

interface EditRoleDialogProps {
  role: Role
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleUpdated?: () => void
}

export function EditRoleDialog({ role, open, onOpenChange, onRoleUpdated }: EditRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    isActive: role.isActive,
    // Handle both flattened API response and nested database structure
    selectedPermissions: role.permissions.map(p => p.permission?.id || p.id),
  })

  useEffect(() => {
    if (open) {
      fetchPermissions()
    }
  }, [open])

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      } else {
        console.error('Error fetching permissions: API returned non-OK status')
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert permission IDs to permission names for the API
      const permissionNames = formData.selectedPermissions
        .map(id => permissions.find(p => p.id === id)?.name)
        .filter((name): name is string => !!name)

      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          permissions: permissionNames,
        }),
      })

      if (response.ok) {
        toast.success('Role updated successfully')
        onRoleUpdated?.()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: checked
        ? [...prev.selectedPermissions, permissionId]
        : prev.selectedPermissions.filter(id => id !== permissionId)
    }))
  }

  const getPermissionCategory = (permissionName: string) => {
    if (permissionName.includes('USER')) return 'User Management'
    if (permissionName.includes('ROLE')) return 'Role Management'
    if (permissionName.includes('SEEKER')) return 'Seeker Management'
    if (permissionName.includes('INQUIRY')) return 'Inquiry Management'
    if (permissionName.includes('TASK')) return 'Task Management'
    if (permissionName.includes('PROGRAM')) return 'Program Management'
    if (permissionName.includes('CAMPAIGN')) return 'Campaign Management'
    if (permissionName.includes('PROJECT')) return 'Project Management'
    if (permissionName.includes('DEAL')) return 'Deal Management'
    if (permissionName.includes('CLIENT')) return 'Client Management'
    if (permissionName.includes('REPORT') || permissionName.includes('ANALYTICS')) return 'Reports & Analytics'
    if (permissionName.includes('SETTINGS') || permissionName.includes('SYSTEM')) return 'System Settings'
    if (permissionName.includes('ADMINISTRATOR') || permissionName === 'MANAGE_ALL_USERS') return 'Special Permissions'
    return 'Other'
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission.name)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl lg:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Edit Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-medium">Status</Label>
                <div className="flex items-center space-x-3 h-11">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="isActive" className="text-base cursor-pointer">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role and its responsibilities"
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Permissions</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.selectedPermissions.length} of {permissions.length} selected
                </span>
              </div>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100 border-b pb-2">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <Checkbox
                            id={permission.id}
                            checked={formData.selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                            className="mt-1 h-4 w-4"
                          />
                          <Label 
                            htmlFor={permission.id} 
                            className="text-sm cursor-pointer leading-tight flex-1"
                            title={permission.description || undefined}
                          >
                            {permission.name.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 px-6"
            >
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
