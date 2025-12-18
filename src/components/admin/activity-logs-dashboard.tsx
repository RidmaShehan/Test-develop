'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  MapPin, 
  Clock, 
  User, 
  Shield, 
  Download,
  Filter,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react'
import { LoginTrendsChart } from './login-trends-chart'

interface ActivityLog {
  id: string
  userId: string
  activityType: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
  location?: {
    country?: string
    city?: string
    region?: string
    latitude?: number
    longitude?: number
  }
  sessionId?: string
  deviceInfo?: {
    browser?: string
    os?: string
    device?: string
  }
  isSuccessful: boolean
  failureReason?: string
  metadata?: any
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  isActive: boolean
}

export function ActivityLogsDashboard() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    activityType: '',
    startDate: '',
    endDate: '',
    isSuccessful: '',
    search: ''
  })

  const [selectedTab, setSelectedTab] = useState('logs')

  useEffect(() => {
    fetchActivityLogs()
    fetchSystemSettings()
  }, [filters, pagination.page])

  const fetchActivityLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      })

      const response = await fetch(`/api/user-activity?${params}`)
      const data = await response.json()
      
      setActivityLogs(data.activityLogs || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/system-settings')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSystemSettings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching system settings:', error)
      setSystemSettings([]) // Set empty array as fallback
    }
  }

  const updateSystemSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })

      if (response.ok) {
        fetchSystemSettings()
      }
    } catch (error) {
      console.error('Error updating system setting:', error)
    }
  }

  const [exporting, setExporting] = useState(false)

  const exportLogs = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(true)
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
        format
      })

      const response = await fetch(`/api/user-activity/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const extension = format === 'excel' ? 'xlsx' : 'pdf'
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting logs:', error)
      alert('Failed to export logs. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'LOGIN': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'LOGOUT': return <XCircle className="h-4 w-4 text-red-500" />
      case 'SESSION_TIMEOUT': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PASSWORD_CHANGE': return <Shield className="h-4 w-4 text-blue-500" />
      case 'PROFILE_UPDATE': return <User className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (isSuccessful: boolean, activityType: string) => {
    if (activityType === 'LOGOUT') {
      return <Badge variant="secondary">Logged Out</Badge>
    }
    return isSuccessful ? 
      <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">Success</Badge> :
      <Badge variant="destructive">Failed</Badge>
  }

  const loggingEnabled = systemSettings?.find(s => s.key === 'USER_ACTIVITY_LOGGING_ENABLED')?.value === 'true' || false

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">User Activity Logs</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Monitor user login/logout activities and system access</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
          <Button 
            onClick={() => exportLogs('excel')} 
            variant="outline" 
            size="sm"
            disabled={exporting}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export Excel'}</span>
            <span className="sm:hidden">{exporting ? 'Exporting...' : 'Excel'}</span>
          </Button>
          <Button 
            onClick={() => exportLogs('pdf')} 
            variant="outline" 
            size="sm"
            disabled={exporting}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export PDF'}</span>
            <span className="sm:hidden">{exporting ? 'Exporting...' : 'PDF'}</span>
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="logs" className="text-xs sm:text-sm">Activity Logs</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity Type</label>
                  <Select value={filters.activityType || "all"} onValueChange={(value) => setFilters({...filters, activityType: value === "all" ? "" : value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All activities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All activities</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="SESSION_TIMEOUT">Session Timeout</SelectItem>
                      <SelectItem value="PASSWORD_CHANGE">Password Change</SelectItem>
                      <SelectItem value="PROFILE_UPDATE">Profile Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Showing {activityLogs.length} of {pagination.total} activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading activity logs...</p>
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No activity logs found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters to see more results</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white/10 sm:rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[140px]">Timestamp</TableHead>
                              <TableHead className="min-w-[180px]">User</TableHead>
                              <TableHead className="min-w-[120px]">Activity</TableHead>
                              <TableHead className="min-w-[150px] hidden lg:table-cell">Location</TableHead>
                              <TableHead className="min-w-[150px] hidden md:table-cell">Device</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                              <TableHead className="min-w-[120px] hidden xl:table-cell">IP Address</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activityLogs.map((log) => (
                              <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    {getActivityIcon(log.activityType)}
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {new Date(log.timestamp).toLocaleDateString()}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{log.user.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{log.user.email}</div>
                                    <Badge variant="outline" className="text-xs">{log.user.role}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{log.activityType}</div>
                                    {log.failureReason && (
                                      <div className="text-xs text-red-600 dark:text-red-400 truncate max-w-[120px]" title={log.failureReason}>
                                        {log.failureReason}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap hidden lg:table-cell">
                                  {log.location ? (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                      <span className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[130px]" title={log.location.city && log.location.country ? `${log.location.city}, ${log.location.country}` : log.location.country || 'Unknown'}>
                                        {log.location.city && log.location.country 
                                          ? `${log.location.city}, ${log.location.country}`
                                          : log.location.country || 'Unknown'
                                        }
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 dark:text-gray-500">Unknown</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap hidden md:table-cell">
                                  {log.deviceInfo ? (
                                    <div className="text-sm space-y-0.5">
                                      <div className="text-gray-900 dark:text-gray-100 truncate max-w-[130px]" title={log.deviceInfo.browser}>{log.deviceInfo.browser}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[130px]" title={log.deviceInfo.os}>{log.deviceInfo.os}</div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 dark:text-gray-500">Unknown</span>
                                  )}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {getStatusBadge(log.isSuccessful, log.activityType)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap hidden xl:table-cell">
                                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{log.ipAddress || 'N/A'}</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                              pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (pagination.page >= pagination.pages - 2) {
                              pageNum = pagination.pages - 4 + i;
                            } else {
                              pageNum = pagination.page - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPagination({...pagination, page: pageNum})}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                          disabled={pagination.page >= pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <LoginTrendsChart 
            trends={Object.values(activityLogs
              .filter(log => log.activityType === 'LOGIN' || log.activityType === 'LOGOUT')
              .reduce((acc, log) => {
                const date = new Date(log.timestamp).toISOString().split('T')[0]
                if (!acc[date]) {
                  acc[date] = { date, logins: 0, logouts: 0 }
                }
                if (log.activityType === 'LOGIN' && log.isSuccessful) {
                  acc[date].logins++
                } else if (log.activityType === 'LOGOUT') {
                  acc[date].logouts++
                }
                return acc
              }, {} as Record<string, { date: string; logins: number; logouts: number }>))
              .sort((a, b) => a.date.localeCompare(b.date))
            }
            title="Activity Trends"
            description="Login and logout patterns over time"
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logging Settings</CardTitle>
              <CardDescription>
                Configure user activity logging preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Activity Logging</h3>
                  <p className="text-sm text-gray-600">
                    Track user login/logout activities and system access
                  </p>
                </div>
                <Switch
                  checked={loggingEnabled}
                  onCheckedChange={(checked) => 
                    updateSystemSetting('USER_ACTIVITY_LOGGING_ENABLED', checked.toString())
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
