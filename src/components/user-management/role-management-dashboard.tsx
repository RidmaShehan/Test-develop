'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Shield, Users, Settings, Eye, EyeOff } from 'lucide-react'

interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: Permission[]
  userCount: number
}

interface Permission {
  id: string
  name: string
  description?: string
  category: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

const PERMISSION_CATEGORIES = {
  'User Management': ['CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES'],
  'Role Management': ['CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS'],
  'Seeker Management': ['CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER'],
  'Task Management': ['CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK'],
  'Program Management': ['CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM'],
  'Campaign Management': ['CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS'],
  'Inquiry Management': ['CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS'],
  'Reports & Analytics': ['READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS'],
  'System Settings': ['READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG'],
  'Special Permissions': ['DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION']
}

export function RoleManagementDashboard() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [newUserRole, setNewUserRole] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rolesRes, usersRes, permissionsRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/users'),
        fetch('/api/permissions')
      ])

      const rolesData = await rolesRes.json()
      const usersData = await usersRes.json()
      const permissionsData = await permissionsRes.json()

      setRoles(rolesData)
      setUsers(usersData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required')
      return
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions
        })
      })

      if (response.ok) {
        toast.success('Role created successfully')
        setIsCreateDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('Failed to create role')
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole || !roleName.trim()) {
      toast.error('Role name is required')
      return
    }

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: selectedPermissions
        })
      })

      if (response.ok) {
        toast.success('Role updated successfully')
        setIsEditDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Failed to update role')
    }
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This will affect all users with this role.`)) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Role deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Failed to delete role')
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUser || !newUserRole) {
      toast.error('Please select a user and role')
      return
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newUserRole
        })
      })

      if (response.ok) {
        toast.success('User role updated successfully')
        setIsAssignDialogOpen(false)
        setSelectedUser(null)
        setNewUserRole('')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    }
  }

  const resetForm = () => {
    setRoleName('')
    setRoleDescription('')
    setSelectedPermissions([])
    setSelectedRole(null)
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setRoleName(role.name)
    setRoleDescription(role.description || '')
    setSelectedPermissions(role.permissions.map(p => p.name))
    setIsEditDialogOpen(true)
  }

  const openAssignDialog = (user: User) => {
    setSelectedUser(user)
    setNewUserRole(user.role)
    setIsAssignDialogOpen(true)
  }

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const selectAllPermissions = () => {
    const allPermissions = Object.values(PERMISSION_CATEGORIES).flat()
    setSelectedPermissions(allPermissions)
  }

  const clearAllPermissions = () => {
    setSelectedPermissions([])
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'ADMINISTRATOR': return <Shield className="h-4 w-4" />
      case 'ADMIN': return <Settings className="h-4 w-4" />
      case 'DEVELOPER': return <Users className="h-4 w-4" />
      case 'COORDINATOR': return <Users className="h-4 w-4" />
      case 'VIEWER': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'ADMINISTRATOR': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-orange-100 text-orange-800'
      case 'DEVELOPER': return 'bg-blue-100 text-blue-800'
      case 'COORDINATOR': return 'bg-green-100 text-green-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading role management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">User Assignments</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoles.map((role) => (
              <Card key={role.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(role.name)}
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                    </div>
                    <Badge className={getRoleColor(role.name)}>
                      {role.userCount} users
                    </Badge>
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Permissions:</span>
                      <span className="font-medium">{role.permissions.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignDialog(user)}
                      >
                        Change Role
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="space-y-4">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {perms.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllPermissions}>
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {perms.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`create-${permission}`}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <Label htmlFor={`create-${permission}`} className="text-sm">
                            {permission.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRoleName">Role Name</Label>
              <Input
                id="editRoleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">Description</Label>
              <Input
                id="editRoleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllPermissions}>
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {perms.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${permission}`}
                            checked={selectedPermissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <Label htmlFor={`edit-${permission}`} className="text-sm">
                            {permission.replace(/_/g, ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Input
                value={selectedUser?.name || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRole">Role</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
