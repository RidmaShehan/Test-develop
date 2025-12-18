'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react'
import { EditLevelDialog } from './edit-level-dialog'
import { DeleteLevelDialog } from './delete-level-dialog'
import { PermissionGate } from '@/hooks/use-permissions'

interface Level {
  id: string
  name: string
  description: string | null
  isVisible: boolean
  sortOrder: number
  createdAt: string
  _count: {
    programs: number
  }
}

export function LevelsTable() {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  const [deletingLevel, setDeletingLevel] = useState<Level | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    try {
      const response = await fetch('/api/levels')
      if (response.ok) {
        const data = await response.json()
        setLevels(data)
      }
    } catch (error) {
      console.error('Error fetching levels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditLevel = (level: Level) => {
    setEditingLevel(level)
  }

  const handleDeleteLevel = (level: Level) => {
    setDeletingLevel(level)
    setDeleteDialogOpen(true)
  }

  const handleLevelDeleted = () => {
    fetchLevels()
  }

  const handleToggleVisibility = async (levelId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/levels/${levelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVisible: !currentVisibility,
        }),
      })
      if (response.ok) {
        fetchLevels()
      }
    } catch (error) {
      console.error('Error updating level visibility:', error)
    }
  }

  const handleMoveLevel = async (levelId: string, direction: 'up' | 'down') => {
    const currentLevel = levels.find(l => l.id === levelId)
    if (!currentLevel) return

    const sortedLevels = [...levels].sort((a, b) => a.sortOrder - b.sortOrder)
    const currentIndex = sortedLevels.findIndex(l => l.id === levelId)
    
    if (direction === 'up' && currentIndex > 0) {
      const targetLevel = sortedLevels[currentIndex - 1]
      await updateSortOrder(levelId, targetLevel.sortOrder)
      await updateSortOrder(targetLevel.id, currentLevel.sortOrder)
    } else if (direction === 'down' && currentIndex < sortedLevels.length - 1) {
      const targetLevel = sortedLevels[currentIndex + 1]
      await updateSortOrder(levelId, targetLevel.sortOrder)
      await updateSortOrder(targetLevel.id, currentLevel.sortOrder)
    }
  }

  const updateSortOrder = async (levelId: string, newSortOrder: number) => {
    try {
      await fetch(`/api/levels/${levelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sortOrder: newSortOrder,
        }),
      })
    } catch (error) {
      console.error('Error updating sort order:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading levels...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveLevel(level.id, 'up')}
                          disabled={levels.findIndex(l => l.id === level.id) === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-mono">{level.sortOrder}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveLevel(level.id, 'down')}
                          disabled={levels.findIndex(l => l.id === level.id) === levels.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell>
                      {level.description || <span className="text-gray-400">No description</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={level.isVisible ? "default" : "secondary"}>
                        {level.isVisible ? (
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Visible</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <EyeOff className="h-3 w-3" />
                            <span>Hidden</span>
                          </div>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {level._count.programs} programs
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(level.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <PermissionGate permissions={['MANAGE_PROGRAM_LEVELS']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditLevel(level)}
                            title="Edit level"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['MANAGE_PROGRAM_LEVELS']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleVisibility(level.id, level.isVisible)}
                            title={level.isVisible ? "Hide level" : "Show level"}
                          >
                            {level.isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['MANAGE_PROGRAM_LEVELS']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteLevel(level)}
                            disabled={level._count.programs > 0}
                            title={level._count.programs > 0 ? "Cannot delete level with programs" : "Delete level"}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-gray-400 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
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

          {levels.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No levels found. Create your first level to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {editingLevel && (
        <EditLevelDialog
          level={editingLevel}
          open={!!editingLevel}
          onOpenChange={(open) => !open && setEditingLevel(null)}
          onLevelUpdated={fetchLevels}
        />
      )}

      {/* Delete Level Dialog */}
      <DeleteLevelDialog
        level={deletingLevel}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onLevelDeleted={handleLevelDeleted}
      />
    </>
  )
}
