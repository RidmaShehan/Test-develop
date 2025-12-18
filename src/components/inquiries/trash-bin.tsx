'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface DeletedInquiry {
  id: string
  fullName: string
  phone: string
  email?: string | null
  city?: string | null
  deletedAt?: string | null
  createdById?: string | null
}

export function InquiriesTrashBin() {
  const [inquiries, setInquiries] = useState<DeletedInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const fetchDeleted = async () => {
    try {
      const response = await fetch('/api/inquiries/trash')
      if (response.ok) {
        const data = await response.json()
        setInquiries(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching deleted inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeleted()
  }, [])

  const handleRestore = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to restore the inquiry "${name}"?`)) return

    setRestoringId(id)
    try {
      const response = await fetch(`/api/inquiries/${id}/restore`, { method: 'POST' })
      if (response.ok) {
        toast.success('Inquiry restored successfully')
        await fetchDeleted()
      } else {
        const result = await response.json().catch(() => ({}))
        toast.error(result.error || 'Failed to restore inquiry')
      }
    } catch (error) {
      console.error('Error restoring inquiry:', error)
      toast.error('Failed to restore inquiry')
    } finally {
      setRestoringId(null)
    }
  }

  const filtered = inquiries.filter((inq) => {
    const q = searchTerm.toLowerCase()
    return (
      inq.fullName.toLowerCase().includes(q) ||
      inq.phone.toLowerCase().includes(q) ||
      (inq.email || '').toLowerCase().includes(q) ||
      (inq.city || '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Loading deleted inquiries...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200">
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl font-semibold text-gray-900">
          <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
          <span>Deleted Inquiries</span>
          {filtered.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs font-medium">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Input
            placeholder="Search deleted inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>

        <div className="rounded-md border border-gray-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-gray-50/50">
                <TableHead className="font-semibold text-gray-900">Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Phone</TableHead>
                <TableHead className="font-semibold text-gray-900">Email</TableHead>
                <TableHead className="font-semibold text-gray-900">City</TableHead>
                <TableHead className="font-semibold text-gray-900">Deleted</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inq) => (
                <TableRow key={inq.id} className="hover:bg-gray-50/30 transition-colors">
                  <TableCell className="font-medium text-gray-900 whitespace-nowrap">{inq.fullName}</TableCell>
                  <TableCell className="text-gray-700 whitespace-nowrap">{inq.phone}</TableCell>
                  <TableCell className="text-gray-700 whitespace-nowrap">{inq.email || <span className="text-gray-400">-</span>}</TableCell>
                  <TableCell className="text-gray-700 whitespace-nowrap">{inq.city || <span className="text-gray-400">-</span>}</TableCell>
                  <TableCell className="text-gray-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{inq.deletedAt ? new Date(inq.deletedAt).toLocaleString() : '-'}</span>
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRestore(inq.id, inq.fullName)}
                      disabled={restoringId === inq.id}
                      className="text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      {restoringId === inq.id ? 'Restoring...' : 'Restore'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {inquiries.length === 0 ? 'No deleted inquiries found' : 'No inquiries match your search'}
            </p>
            <p className="text-xs text-muted-foreground">
              {inquiries.length === 0 ? 'Deleted inquiries will appear here' : 'Try adjusting your search criteria'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


