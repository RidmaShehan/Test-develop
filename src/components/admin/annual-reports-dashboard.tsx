'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Download,
  Calendar,
  Users,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  Filter,
  RefreshCw,
  LogOut,
  FileSpreadsheet
} from 'lucide-react'
import { LoginTrendsChart } from './login-trends-chart'

interface ReportData {
  totalLogins: number
  totalLogouts: number
  uniqueUsers: number
  averageSessionDuration: number
  topCountries: Array<{ country: string; count: number }>
  topDevices: Array<{ device: string; count: number }>
  topBrowsers: Array<{ browser: string; count: number }>
  loginTrends: Array<{ date: string; logins: number; logouts: number }>
  userActivity: Array<{
    userId: string
    userName: string
    userEmail: string
    userRole: string
    totalLogins: number
    totalLogouts: number
    lastLogin: string
    lastLogout: string
    averageSessionDuration: number
  }>
}

export function AnnualReportsDashboard() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    fetchReportData()
  }, [selectedYear, selectedMonth])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        year: selectedYear,
        ...(selectedMonth && { month: selectedMonth })
      })

      const response = await fetch(`/api/reports/annual?${params}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(format)
      
      const params = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth || '',
        format
      })

      const response = await fetch(`/api/reports/export?${params}`)
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const extension = format === 'excel' ? 'xlsx' : 'pdf'
      a.download = `annual-report-${selectedYear}${selectedMonth ? `-${selectedMonth}` : ''}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      // Show success message
      alert(`Report exported successfully as ${format.toUpperCase()}!`)
      
    } catch (error) {
      console.error('Error exporting report:', error)
      alert(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExporting(null)
    }
  }

  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i.toString())
    }
    return years
  }

  const generateMonths = () => {
    return [
      { value: 'all', label: 'All Months' },
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Annual Reports</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Comprehensive user activity and system usage reports</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
          <Button 
            onClick={() => exportReport('excel')} 
            variant="outline" 
            size="sm"
            disabled={exporting !== null}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{exporting === 'excel' ? 'Exporting...' : 'Export Excel'}</span>
            <span className="sm:hidden">{exporting === 'excel' ? 'Exporting...' : 'Excel'}</span>
          </Button>
          <Button 
            onClick={() => exportReport('pdf')} 
            variant="outline" 
            size="sm"
            disabled={exporting !== null}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}</span>
            <span className="sm:hidden">{exporting === 'pdf' ? 'Exporting...' : 'PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {generateYears().map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
              <Select value={selectedMonth || "all"} onValueChange={(value) => setSelectedMonth(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  {generateMonths().map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button onClick={fetchReportData} className="w-full" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">User Activity</TabsTrigger>
          <TabsTrigger value="geography" className="text-xs sm:text-sm">Geography</TabsTrigger>
          <TabsTrigger value="devices" className="text-xs sm:text-sm">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Modern Key Metrics - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 dark:bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total Logins</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-200 truncate">{reportData?.totalLogins || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500 dark:bg-rose-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300">Total Logouts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-rose-800 dark:text-rose-200 truncate">{reportData?.totalLogouts || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300">Unique Users</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200 truncate">{reportData?.uniqueUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 dark:bg-orange-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-300">Avg Session</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-800 dark:text-orange-200 truncate">
                      {reportData?.averageSessionDuration 
                        ? `${Math.round(reportData.averageSessionDuration)}m`
                        : '0m'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login Trends Chart */}
          <LoginTrendsChart 
            trends={reportData?.loginTrends || []}
            title="Login Trends"
            description="Daily login and logout activity"
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Summary</CardTitle>
              <CardDescription>Individual user login/logout statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {!reportData?.userActivity || reportData.userActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No user activity data</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No user activity found for the selected period</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white/10 sm:rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">User</TableHead>
                            <TableHead className="min-w-[100px] hidden sm:table-cell">Role</TableHead>
                            <TableHead className="min-w-[100px]">Logins</TableHead>
                            <TableHead className="min-w-[100px] hidden md:table-cell">Logouts</TableHead>
                            <TableHead className="min-w-[120px] hidden lg:table-cell">Last Login</TableHead>
                            <TableHead className="min-w-[100px] hidden md:table-cell">Avg Session</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.userActivity.map((user) => (
                            <TableRow key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <TableCell className="whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.userName}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{user.userEmail}</div>
                                  <Badge variant="outline" className="text-xs sm:hidden">{user.userRole}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap hidden sm:table-cell">
                                <Badge variant="outline">{user.userRole}</Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{user.totalLogins}</span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap hidden md:table-cell">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{user.totalLogouts}</span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap hidden lg:table-cell">
                                <div className="text-sm">
                                  {user.lastLogin ? (
                                    <>
                                      <div className="text-gray-900 dark:text-gray-100">{new Date(user.lastLogin).toLocaleDateString()}</div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(user.lastLogin).toLocaleTimeString()}</div>
                                    </>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">Never</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap hidden md:table-cell">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.averageSessionDuration 
                                    ? `${Math.round(user.averageSessionDuration)}m`
                                    : '0m'
                                  }
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Top Countries
                </CardTitle>
                <CardDescription>Geographic distribution of user activity</CardDescription>
              </CardHeader>
              <CardContent>
                {!reportData?.topCountries || reportData.topCountries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MapPin className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No geographic data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportData.topCountries.map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{country.country || 'Unknown'}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">{country.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Devices</CardTitle>
                <CardDescription>Most commonly used devices</CardDescription>
              </CardHeader>
              <CardContent>
                {!reportData?.topDevices || reportData.topDevices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart3 className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No device data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportData.topDevices.map((device, index) => (
                      <div key={device.device} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{device.device || 'Unknown'}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">{device.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Browsers</CardTitle>
                <CardDescription>Most commonly used browsers</CardDescription>
              </CardHeader>
              <CardContent>
                {!reportData?.topBrowsers || reportData.topBrowsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart3 className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No browser data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportData.topBrowsers.map((browser, index) => (
                      <div key={browser.browser} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">{index + 1}.</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{browser.browser || 'Unknown'}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">{browser.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
