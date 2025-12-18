'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QATable } from './qa-table'
import { AddQADialog } from './add-qa-dialog'
import { EditQADialog } from './edit-qa-dialog'
import { Plus, MessageSquare, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

interface Program {
  id: string
  name: string
  level: string | null
  campus: string
}

interface QAItem {
  id: string
  programId: string
  question: string
  answer: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function QAManagementDashboard() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [qaItems, setQaItems] = useState<QAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingQA, setEditingQA] = useState<QAItem | null>(null)

  useEffect(() => {
    fetchPrograms()
  }, [])

  useEffect(() => {
    if (selectedProgramId) {
      fetchQAItems(selectedProgramId)
    } else {
      setQaItems([])
    }
  }, [selectedProgramId])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data)
        if (data.length > 0 && !selectedProgramId) {
          setSelectedProgramId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to load programs')
    } finally {
      setLoading(false)
    }
  }

  const fetchQAItems = async (programId: string) => {
    try {
      const response = await fetch(`/api/programs/${programId}/qa`)
      if (response.ok) {
        const data = await response.json()
        setQaItems(data)
      } else {
        toast.error('Failed to load Q&A items')
      }
    } catch (error) {
      console.error('Error fetching Q&A items:', error)
      toast.error('Failed to load Q&A items')
    }
  }

  const handleAddSuccess = () => {
    if (selectedProgramId) {
      fetchQAItems(selectedProgramId)
    }
    setShowAddDialog(false)
  }

  const handleEditSuccess = () => {
    if (selectedProgramId) {
      fetchQAItems(selectedProgramId)
    }
    setEditingQA(null)
  }

  const handleDelete = async (qaId: string) => {
    if (!confirm('Are you sure you want to delete this Q&A item?')) {
      return
    }

    try {
      const response = await fetch(`/api/programs/qa/${qaId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Q&A item deleted successfully')
        if (selectedProgramId) {
          fetchQAItems(selectedProgramId)
        }
      } else {
        toast.error('Failed to delete Q&A item')
      }
    } catch (error) {
      console.error('Error deleting Q&A item:', error)
      toast.error('Failed to delete Q&A item')
    }
  }

  const selectedProgram = programs.find(p => p.id === selectedProgramId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Program Q&A Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Select Program</label>
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>{program.name}</span>
                        <span className="text-xs text-gray-500">
                          ({program.level || 'N/A'} - {program.campus})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProgramId && (
              <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Q&A
              </Button>
            )}
          </div>

          {selectedProgram && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {selectedProgram.name}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedProgram.level || 'N/A'} • {selectedProgram.campus}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProgramId && (
        <QATable
          qaItems={qaItems}
          onEdit={(qa) => setEditingQA(qa)}
          onDelete={handleDelete}
          loading={loading}
        />
      )}

      {showAddDialog && selectedProgramId && (
        <AddQADialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          programId={selectedProgramId}
          onSuccess={handleAddSuccess}
        />
      )}

      {editingQA && (
        <EditQADialog
          open={!!editingQA}
          onOpenChange={(open) => !open && setEditingQA(null)}
          qaItem={editingQA}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

