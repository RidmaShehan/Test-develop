'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, MessageSquare } from 'lucide-react'

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

interface QATableProps {
  qaItems: QAItem[]
  onEdit: (qa: QAItem) => void
  onDelete: (qaId: string) => void
  loading?: boolean
}

export function QATable({ qaItems, onEdit, onDelete, loading }: QATableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading Q&A items...</p>
        </CardContent>
      </Card>
    )
  }

  if (qaItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-2">No Q&A items yet</p>
          <p className="text-sm text-gray-400">
            Add your first Q&A item to help answer common questions about this program
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qaItems.map((qa, index) => (
                <TableRow key={qa.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {qa.question}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {qa.answer}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={qa.isActive ? 'default' : 'secondary'}
                      className={qa.isActive ? 'bg-green-100 text-green-800' : ''}
                    >
                      {qa.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(qa)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(qa.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

