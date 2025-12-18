'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Phone, MessageSquare, Mail } from 'lucide-react'
import { SeekerViewDialog } from './seeker-view-dialog'
import { PermissionGate } from '@/hooks/use-permissions'

interface Seeker {
  id: string
  fullName: string
  phone: string
  email?: string
  city?: string
  stage: string
  marketingSource: string
  createdAt: string
  programInterest?: {
    name: string
  }
}

export function SeekersTable() {
  const [seekers, setSeekers] = useState<Seeker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [selectedSeeker, setSelectedSeeker] = useState<Seeker | null>(null)

  useEffect(() => {
    fetchSeekers()
  }, [])

  const fetchSeekers = async () => {
    try {
      const response = await fetch('/api/seekers')
      if (response.ok) {
        const data = await response.json()
        setSeekers(data)
      }
    } catch (error) {
      console.error('Error fetching seekers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSeekers = seekers.filter(seeker => {
    const matchesSearch = seeker.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seeker.phone.includes(searchTerm) ||
                         (seeker.email && seeker.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStage = stageFilter === 'all' || seeker.stage === stageFilter
    return matchesSearch && matchesStage
  })

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-gray-100 text-gray-800',
      ATTEMPTING_CONTACT: 'bg-yellow-100 text-yellow-800',
      CONNECTED: 'bg-blue-100 text-blue-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      COUNSELING_SCHEDULED: 'bg-purple-100 text-purple-800',
      CONSIDERING: 'bg-orange-100 text-orange-800',
      READY_TO_REGISTER: 'bg-emerald-100 text-emerald-800',
      LOST: 'bg-red-100 text-red-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      WALK_IN: 'bg-green-100 text-green-800',
      FB_AD: 'bg-blue-100 text-blue-800',
      REFERRAL: 'bg-purple-100 text-purple-800',
      WEBSITE: 'bg-orange-100 text-orange-800',
      PHONE: 'bg-gray-100 text-gray-800',
    }
    return colors[source] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading seekers...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Seekers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="ATTEMPTING_CONTACT">Attempting Contact</SelectItem>
                <SelectItem value="CONNECTED">Connected</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="COUNSELING_SCHEDULED">Counseling Scheduled</SelectItem>
                <SelectItem value="CONSIDERING">Considering</SelectItem>
                <SelectItem value="READY_TO_REGISTER">Ready to Register</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeekers.map((seeker) => (
                  <TableRow key={seeker.id}>
                    <TableCell className="font-medium">{seeker.fullName}</TableCell>
                    <TableCell>{seeker.phone}</TableCell>
                    <TableCell>{seeker.email || '-'}</TableCell>
                    <TableCell>{seeker.programInterest?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStageColor(seeker.stage)}>
                        {seeker.stage.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSourceColor(seeker.marketingSource)}>
                        {seeker.marketingSource.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(seeker.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <PermissionGate permissions={['READ_SEEKER']}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSeeker(seeker)}
                            title="View seeker details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['MANAGE_SEEKER_INTERACTIONS']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            title="Call seeker"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['MANAGE_SEEKER_INTERACTIONS']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            title="Send message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        
                        <PermissionGate permissions={['MANAGE_SEEKER_INTERACTIONS']}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            title="Send email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSeekers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No seekers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSeeker && (
        <SeekerViewDialog
          seeker={selectedSeeker}
          open={!!selectedSeeker}
          onOpenChange={() => setSelectedSeeker(null)}
        />
      )}
    </>
  )
}
