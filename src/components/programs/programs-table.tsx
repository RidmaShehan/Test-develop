'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Edit, 
  Trash2, 
  Users, 
  Search, 
  Calendar, 
  Building2, 
  GraduationCap,
  MoreVertical,
  RefreshCw,
  Loader2,
  BookOpen
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditProgramDialog } from './edit-program-dialog'
import { DeleteProgramDialog } from './delete-program-dialog'
import { PermissionGate } from '@/hooks/use-permissions'

interface Program {
  id: string
  name: string
  levelId?: string
  level?: string
  levelRelation?: {
    id: string
    name: string
    isVisible: boolean
  }
  campus: string
  nextIntakeDate?: string
  createdAt: string
  _count?: {
    seekers: number
    preferredBy?: number
  }
}

interface ProgramsTableProps {
  onDataChange?: () => void
}

export function ProgramsTable({ onDataChange }: ProgramsTableProps) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [campusFilter, setCampusFilter] = useState('all')
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    filterPrograms()
  }, [programs, searchTerm, levelFilter, campusFilter])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPrograms = () => {
    let filtered = [...programs]
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.campus.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (levelFilter !== 'all') {
      filtered = filtered.filter(p => getLevelName(p) === levelFilter)
    }
    
    if (campusFilter !== 'all') {
      filtered = filtered.filter(p => p.campus === campusFilter)
    }
    
    setFilteredPrograms(filtered)
  }

  const getLevelColor = (levelName: string) => {
    const colors: Record<string, string> = {
      'Certificate': 'bg-blue-100 text-blue-800 border-blue-200',
      'Diploma': 'bg-green-100 text-green-800 border-green-200',
      'Bachelor': 'bg-purple-100 text-purple-800 border-purple-200',
      'Master': 'bg-orange-100 text-orange-800 border-orange-200',
      'PhD': 'bg-red-100 text-red-800 border-red-200',
      'Doctorate': 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[levelName] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getLevelName = (program: Program) => {
    return program.levelRelation?.name || program.level || 'Unknown'
  }

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program)
    setEditDialogOpen(true)
  }

  const handleDeleteProgram = (program: Program) => {
    setDeletingProgram(program)
    setDeleteDialogOpen(true)
  }

  const handleProgramUpdated = () => {
    fetchPrograms()
    onDataChange?.()
  }

  const handleProgramDeleted = () => {
    fetchPrograms()
    onDataChange?.()
  }

  const uniqueLevels = [...new Set(programs.map(p => getLevelName(p)))]
  const uniqueCampuses = [...new Set(programs.map(p => p.campus))]

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 animate-pulse" />
            </div>
            <p className="text-gray-500">Loading programs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">All Programs</CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">{filteredPrograms.length} programs found</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPrograms} className="w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {uniqueLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={campusFilter} onValueChange={setCampusFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                {uniqueCampuses.map(campus => (
                  <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || levelFilter !== 'all' || campusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchTerm('')
                  setLevelFilter('all')
                  setCampusFilter('all')
                }}
                className="h-10"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="font-semibold">Program Name</TableHead>
                  <TableHead className="font-semibold">Level</TableHead>
                  <TableHead className="font-semibold">Campus</TableHead>
                  <TableHead className="font-semibold">Next Intake</TableHead>
                  <TableHead className="font-semibold text-center">Interested</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">{program.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getLevelColor(getLevelName(program))} border`}>
                        {getLevelName(program)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {program.campus}
                      </div>
                    </TableCell>
                    <TableCell>
                      {program.nextIntakeDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(program.nextIntakeDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{program._count?.seekers || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(program.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGate permissions={['UPDATE_PROGRAM']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditProgram(program)}
                            title="Edit program"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['DELETE_PROGRAM']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteProgram(program)}
                            title="Delete program"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Mobile Card View */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{program.name}</h3>
                        <Badge className={`${getLevelColor(getLevelName(program))} border text-xs mt-1`}>
                          {getLevelName(program)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate permissions={['UPDATE_PROGRAM']}>
                          <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate permissions={['DELETE_PROGRAM']}>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProgram(program)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{program.campus}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {program.nextIntakeDate 
                          ? new Date(program.nextIntakeDate).toLocaleDateString()
                          : 'Not scheduled'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{program._count?.seekers || 0}</span>
                        <span className="text-xs">interested</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(program.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No programs found</h3>
              <p className="text-gray-500">
                {searchTerm || levelFilter !== 'all' || campusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first program to get started'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Program Dialog */}
      <EditProgramDialog
        program={editingProgram}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onProgramUpdated={handleProgramUpdated}
      />

      {/* Delete Program Dialog */}
      <DeleteProgramDialog
        program={deletingProgram}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onProgramDeleted={handleProgramDeleted}
      />
    </>
  )
}
