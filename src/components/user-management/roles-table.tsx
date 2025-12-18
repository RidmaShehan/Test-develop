'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Shield, Users, Key, Eye, EyeOff } from 'lucide-react'
import { EditRoleDialog } from './edit-role-dialog'
import { DeleteRoleDialog } from './delete-role-dialog'
import { PermissionGate } from '@/hooks/use-permissions'

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

export function RolesTable() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        console.error('Error fetching roles: API returned non-OK status')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
  }

  const handleDeleteRole = (role: Role) => {
    setDeletingRole(role)
    setDeleteDialogOpen(true)
  }

  const handleRoleDeleted = () => {
    fetchRoles()
  }

  const handleToggleRoleStatus = async (roleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })
      if (response.ok) {
        fetchRoles()
      } else {
        console.error('Error updating role status: API returned non-OK status')
      }
    } catch (error) {
      console.error('Error updating role status:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading roles...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.description || <span className="text-gray-400">No description</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? (
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <EyeOff className="h-3 w-3" />
                            <span>Inactive</span>
                          </div>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{role._count.users}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Key className="h-4 w-4 text-gray-500" />
                        <span>{role._count.permissions}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <PermissionGate permissions={['UPDATE_ROLE']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditRole(role)}
                            title="Edit role"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['UPDATE_ROLE']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleRoleStatus(role.id, role.isActive)}
                            title={role.isActive ? "Deactivate role" : "Activate role"}
                          >
                            {role.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['DELETE_ROLE']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                            title="Delete role"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No roles found.
            </div>
          )}
        </CardContent>
      </Card>

      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          onRoleUpdated={fetchRoles}
        />
      )}

      {/* Delete Role Dialog */}
      <DeleteRoleDialog
        role={deletingRole}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onRoleDeleted={handleRoleDeleted}
      />
    </>
  )
}
