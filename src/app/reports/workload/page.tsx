'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Users,
  Calendar,
  CheckSquare,
  Clock,
  Download,
  Filter,
  BarChart,
  MessageSquare,
  Mail,
  Phone,
  Clock3,
} from 'lucide-react'
import { toast } from 'sonner'

type WorkloadItem = {
  employeeId: string
  employeeName: string
  employeeEmail: string
  employeeRole: string
  assignedTasksCount: number
  completedTasksCount: number
  overdueTasksCount: number
  completionRate: number
  loggedHours: number
  studentInteractions: {
    phone: number
    email: number
    whatsapp: number
    total: number
  }
  emailResponseTime: number
  whatsappResponseTime: number
}

type Project = {
  id: string
  name: string
}

type User = {
  id: string
  name: string
}

export default function WorkloadDashboardPage() {
  const [workload, setWorkload] = useState<WorkloadItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  
  // Filter States
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch filter selections
  useEffect(() => {
    async function loadFilters() {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/users')
        ])
        if (projectsRes.ok) setProjects(await projectsRes.json())
        if (usersRes.ok) setUsers(await usersRes.json())
      } catch (err) {
        console.error('Failed to load filters:', err)
      }
    }
    loadFilters()
  }, [])

  const fetchWorkload = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedProjectId) params.append('projectId', selectedProjectId)
      if (selectedUserId) params.append('userId', selectedUserId)

      const res = await fetch(`/api/dashboard/workload?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setWorkload(data)
      } else {
        toast.error('Failed to fetch workload statistics')
      }
    } catch (err) {
      toast.error('An error occurred loading workload data')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedProjectId, selectedUserId])

  useEffect(() => {
    fetchWorkload()
  }, [fetchWorkload])

  // CSV Report Exporter
  const handleExportCSV = () => {
    if (workload.length === 0) return

    const headers = [
      'Employee Name',
      'Role',
      'Assigned Tasks',
      'Completed Tasks',
      'Overdue Tasks',
      'Completion Rate',
      'Logged Hours',
      'Phone Calls',
      'Emails',
      'WhatsApp Messages',
      'Avg Email Response (mins)',
      'Avg WhatsApp Response (mins)'
    ]

    const rows = workload.map(item => [
      item.employeeName,
      item.employeeRole,
      item.assignedTasksCount,
      item.completedTasksCount,
      item.overdueTasksCount,
      `${item.completionRate}%`,
      item.loggedHours,
      item.studentInteractions.phone,
      item.studentInteractions.email,
      item.studentInteractions.whatsapp,
      item.emailResponseTime,
      item.whatsappResponseTime
    ])

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `staff_workload_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Summary Metrics calculations
  const totalAssigned = workload.reduce((sum, item) => sum + item.assignedTasksCount, 0)
  const totalCompleted = workload.reduce((sum, item) => sum + item.completedTasksCount, 0)
  const totalHours = workload.reduce((sum, item) => sum + item.loggedHours, 0)
  const averageCompletionRate = workload.length > 0 
    ? Math.round(workload.reduce((sum, item) => sum + item.completionRate, 0) / workload.length)
    : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Staff Workload Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor tasks, time logs, and response metrics per team member</p>
          </div>
          <Button onClick={handleExportCSV} disabled={workload.length === 0} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report (CSV)
          </Button>
        </div>

        {/* Filters Panel */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Manager Filters</span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Start Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">End Date</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full text-xs h-9 p-2 border rounded-md bg-background text-foreground"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Team Member</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full text-xs h-9 p-2 border rounded-md bg-background text-foreground"
                >
                  <option value="">All Members</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Active Tasks</p>
                <h3 className="text-2xl font-bold mt-1 text-foreground">{totalAssigned}</h3>
              </div>
              <CheckSquare className="h-8 w-8 text-primary/80" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tasks Completed</p>
                <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{totalCompleted}</h3>
              </div>
              <BarChart className="h-8 w-8 text-green-500/80" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Logged Hours</p>
                <h3 className="text-2xl font-bold mt-1 text-orange-600 dark:text-orange-400">{totalHours} hrs</h3>
              </div>
              <Clock className="h-8 w-8 text-orange-500/80" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{averageCompletionRate}%</h3>
              </div>
              <Users className="h-8 w-8 text-purple-500/80" />
            </CardContent>
          </Card>
        </div>

        {/* Main Workload Table */}
        <Card className="shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Staff Workload Detail</CardTitle>
            <CardDescription className="text-xs">Summary of tasks, log time, and communication response times</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground animate-pulse">Loading workload data…</div>
            ) : workload.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No employee workload data matched these filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Staff Member</TableHead>
                      <TableHead className="text-xs text-center">Tasks</TableHead>
                      <TableHead className="text-xs text-center">Completion Rate</TableHead>
                      <TableHead className="text-xs text-center">Hours</TableHead>
                      <TableHead className="text-xs text-center">Interactions</TableHead>
                      <TableHead className="text-xs text-center">Avg Email Response</TableHead>
                      <TableHead className="text-xs text-center">Avg WA Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workload.map((item) => (
                      <TableRow key={item.employeeId} className="hover:bg-muted/10">
                        <TableCell>
                          <p className="text-xs font-semibold text-foreground">{item.employeeName}</p>
                          <p className="text-[10px] text-muted-foreground">{item.employeeRole}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex flex-col text-xs">
                            <span className="font-semibold">{item.assignedTasksCount} assigned</span>
                            <span className="text-[10px] text-red-500 font-medium">({item.overdueTasksCount} overdue)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-[120px] mx-auto space-y-1">
                            <div className="flex justify-between text-[10px] font-medium">
                              <span>Rate</span>
                              <span>{item.completionRate}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  item.completionRate >= 75
                                    ? 'bg-green-500'
                                    : item.completionRate >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${item.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs font-semibold">{item.loggedHours} hrs</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                            <span className="inline-flex items-center gap-0.5" title="Phone calls">
                              <Phone className="h-3 w-3 text-primary" /> {item.studentInteractions.phone}
                            </span>
                            <span className="inline-flex items-center gap-0.5" title="Emails">
                              <Mail className="h-3 w-3 text-blue-500" /> {item.studentInteractions.email}
                            </span>
                            <span className="inline-flex items-center gap-0.5" title="WhatsApp">
                              <MessageSquare className="h-3 w-3 text-green-500" /> {item.studentInteractions.whatsapp}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3 text-muted-foreground" />
                            {item.emailResponseTime > 0 ? `${item.emailResponseTime}m` : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3 text-muted-foreground" />
                            {item.whatsappResponseTime > 0 ? `${item.whatsappResponseTime}m` : 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
