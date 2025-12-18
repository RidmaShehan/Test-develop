'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Key, Shield, Users, FileText, Settings, BarChart3 } from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    roles: number
  }
}

export function PermissionsTable() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPermissions()
  }, [])

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
    } finally {
      setLoading(false)
    }
  }

  const getPermissionIcon = (permissionName: string) => {
    if (permissionName.includes('USER')) {
      return <Users className="h-4 w-4" />
    } else if (permissionName.includes('ROLE')) {
      return <Shield className="h-4 w-4" />
    } else if (permissionName.includes('SEEKER')) {
      return <Users className="h-4 w-4" />
    } else if (permissionName.includes('TASK')) {
      return <FileText className="h-4 w-4" />
    } else if (permissionName.includes('PROGRAM')) {
      return <FileText className="h-4 w-4" />
    } else if (permissionName.includes('REPORT')) {
      return <BarChart3 className="h-4 w-4" />
    } else if (permissionName.includes('SETTINGS')) {
      return <Settings className="h-4 w-4" />
    }
    return <Key className="h-4 w-4" />
  }

  const getPermissionCategory = (permissionName: string) => {
    if (permissionName.includes('USER')) return 'User Management'
    if (permissionName.includes('ROLE')) return 'Role Management'
    if (permissionName.includes('SEEKER')) return 'Seeker Management'
    if (permissionName.includes('TASK')) return 'Task Management'
    if (permissionName.includes('PROGRAM')) return 'Program Management'
    if (permissionName.includes('REPORT')) return 'Report Management'
    if (permissionName.includes('SETTINGS')) return 'System Settings'
    return 'Other'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'User Management': 'bg-blue-100 text-blue-800',
      'Role Management': 'bg-purple-100 text-purple-800',
      'Seeker Management': 'bg-green-100 text-green-800',
      'Task Management': 'bg-orange-100 text-orange-800',
      'Program Management': 'bg-cyan-100 text-cyan-800',
      'Report Management': 'bg-pink-100 text-pink-800',
      'System Settings': 'bg-gray-100 text-gray-800',
      'Other': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getActionColor = (permissionName: string) => {
    if (permissionName.includes('CREATE')) return 'bg-green-100 text-green-800'
    if (permissionName.includes('READ')) return 'bg-blue-100 text-blue-800'
    if (permissionName.includes('UPDATE')) return 'bg-yellow-100 text-yellow-800'
    if (permissionName.includes('DELETE')) return 'bg-red-100 text-red-800'
    if (permissionName.includes('EXPORT')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getActionName = (permissionName: string) => {
    if (permissionName.includes('CREATE')) return 'Create'
    if (permissionName.includes('READ')) return 'Read'
    if (permissionName.includes('UPDATE')) return 'Update'
    if (permissionName.includes('DELETE')) return 'Delete'
    if (permissionName.includes('EXPORT')) return 'Export'
    return 'Other'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading permissions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Roles Using</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => {
                const category = getPermissionCategory(permission.name)
                const action = getActionName(permission.name)
                
                return (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {getPermissionIcon(permission.name)}
                        <span>{permission.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(permission.name)}>
                        {action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {permission.description || <span className="text-gray-400">No description</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span>{permission._count.roles}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {permissions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No permissions found.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
