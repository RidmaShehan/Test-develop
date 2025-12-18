'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { safeJsonParse } from '@/lib/utils'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Phone,
  Users,
  Calendar,
  Target,
  BarChart3,
  PieChartIcon,
  Activity,
  Download,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'

interface UserPerformance {
  id: string
  name: string
  email: string
  role: string
  inquiries: number
  converted: number
  conversionRate: number
  interactions: number
  thisMonth: number
  joinedAt: string
}

interface ReportData {
  totalSeekers: number
  convertedSeekers: number
  lostSeekers: number
  readyToRegister: number
  newThisMonth: number
  sourcePerformance: Array<{
    source: string
    count: number
    conversionRate: number
  }>
  stageDistribution: Array<{
    stage: string
    count: number
  }>
  monthlyTrends: Array<{
    month: string
    monthYear?: string
    newSeekers: number
    conversions: number
  }>
  contactMetrics: {
    totalCalls: number
    contactRate: number
    appointmentRate: number
    conversionRate: number
  }
  interactionBreakdown?: Array<{
    outcome: string
    count: number
  }>
  userPerformance?: UserPerformance[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
const GRADIENT_COLORS = {
  blue: { start: '#3b82f6', end: '#1d4ed8' },
  green: { start: '#10b981', end: '#059669' },
  amber: { start: '#f59e0b', end: '#d97706' },
  red: { start: '#ef4444', end: '#dc2626' },
  purple: { start: '#8b5cf6', end: '#7c3aed' },
}

export function ReportsDashboard() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean
    type: 'source' | 'stage' | 'metric' | null
    title: string
    data: any
  }>({ open: false, type: null, title: '', data: null })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports')
      if (response.ok) {
        const reportData = await safeJsonParse(response)
        setData(reportData)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openDetails = (type: 'source' | 'stage' | 'metric', title: string, detailData: any) => {
    setDetailsDialog({ open: true, type, title, data: detailData })
  }

  const getTrendIcon = (value: number) => {
    if (value > 50) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value > 30) return <ArrowUpRight className="h-4 w-4 text-blue-500" />
    if (value > 10) return <ArrowDownRight className="h-4 w-4 text-amber-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getPerformanceBadge = (value: number) => {
    if (value >= 70) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
    if (value >= 50) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
    if (value >= 30) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Average</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Improvement</Badge>
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
        </div>
        <p className="text-lg font-medium text-gray-600">Loading reports...</p>
        <p className="text-sm text-gray-400">Analyzing your data</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-lg font-medium text-gray-900">Failed to load report data</p>
        <p className="text-sm text-gray-500">Please try again later</p>
        <Button onClick={fetchReportData} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  const totalSeekers = data.totalSeekers || data.stageDistribution.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-4 border-b border-gray-200">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Real-time performance insights</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchReportData} 
            className="h-9 sm:h-10 w-full sm:w-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch('/api/reports?format=pdf')
                if (response.ok) {
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `CRM-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  a.remove()
                }
              } catch (error) {
                console.error('Error exporting PDF:', error)
              }
            }}
            className="h-9 sm:h-10 w-full sm:w-auto"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Users</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <PieChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Sources</span>
            <span className="sm:hidden">Sources</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Pipeline</span>
            <span className="sm:hidden">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm py-2 sm:py-2.5">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Trends</span>
            <span className="sm:hidden">Trends</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card 
              className="group cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm border-gray-200"
              onClick={() => openDetails('metric', 'Total Inquiries', { value: totalSeekers, type: 'count' })}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Inquiries</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalSeekers.toLocaleString()}</p>
                </div>
                <div className="flex items-center mt-3">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium px-2 py-0.5">
                    {data.newThisMonth || 0} new this month
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm border-gray-200"
              onClick={() => openDetails('metric', 'Converted Inquiries', { value: data.convertedSeekers || 0, type: 'count' })}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Converted</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(data.convertedSeekers || 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center mt-3">
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-medium px-2 py-0.5">
                    {data.contactMetrics.conversionRate}% rate
                  </Badge>
                </div>
              </CardContent>
            </Card>
          
            <Card 
              className="group cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm border-gray-200"
              onClick={() => openDetails('metric', 'Total Interactions', { value: data.contactMetrics.totalCalls, type: 'count' })}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                  <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Interactions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data.contactMetrics.totalCalls.toLocaleString()}</p>
                </div>
                <div className="flex items-center mt-3">
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium px-2 py-0.5">
                    {data.contactMetrics.contactRate}% contact rate
                  </Badge>
                </div>
              </CardContent>
            </Card>
          
            <Card 
              className="group cursor-pointer hover:shadow-md transition-all duration-200 shadow-sm border-gray-200"
              onClick={() => openDetails('metric', 'Conversion Rate', { value: data.contactMetrics.conversionRate, type: 'rate' })}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{data.contactMetrics.conversionRate}%</p>
                </div>
                <div className="flex items-center mt-3">
                  {getPerformanceBadge(data.contactMetrics.conversionRate)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="lg:col-span-2 shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Performance Overview</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">Monthly acquisition and conversion trends</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openDetails('metric', 'Performance Details', data.monthlyTrends)} className="w-full sm:w-auto">
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-1" /> 
                    <span className="text-xs sm:text-sm">View Details</span>
                  </Button>
                </div>
              </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.monthlyTrends}>
                    <defs>
                      <linearGradient id="colorSeekers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                      }} 
                    />
                    <Legend />
                    <Area type="monotone" dataKey="newSeekers" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSeekers)" strokeWidth={2} name="New Inquiries" />
                    <Area type="monotone" dataKey="conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorConversions)" strokeWidth={2} name="Conversions" />
                  </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
          
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Stage Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">{totalSeekers.toLocaleString()} total inquiries</CardDescription>
              </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.stageDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {data.stageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {data.stageDistribution.slice(0, 4).map((item, index) => (
                    <div key={item.stage} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-gray-600">{item.stage}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    User Performance
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Individual performance metrics for all team members</CardDescription>
                </div>
                <Badge variant="secondary" className="w-fit text-xs font-medium">
                  {data.userPerformance?.length || 0} Active Users
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.userPerformance && data.userPerformance.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="shadow-sm border-gray-200">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-600 mb-1">Total Users</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.userPerformance.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-gray-200">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-600 mb-1">Avg. Inquiries</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {Math.round(data.userPerformance.reduce((sum, u) => sum + u.inquiries, 0) / data.userPerformance.length)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-gray-200">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-600 mb-1">Top Performer</p>
                        <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                          {data.userPerformance[0]?.name || 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-gray-200">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-600 mb-1">Avg. Conversion</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {Math.round(data.userPerformance.reduce((sum, u) => sum + u.conversionRate, 0) / data.userPerformance.length)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* User Performance Table */}
                  <div className="rounded-md border border-gray-200 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-50/50">
                          <TableHead className="font-semibold text-gray-900">User</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Role</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Inquiries</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Converted</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Conv. Rate</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Interactions</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">This Month</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.userPerformance.map((user, index) => (
                          <TableRow 
                            key={user.id} 
                            className="hover:bg-gray-50/30 transition-colors cursor-pointer"
                            onClick={() => openDetails('metric', `${user.name}'s Performance`, user)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs sm:text-sm">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm sm:text-base">{user.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs font-medium">
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-gray-900">{user.inquiries}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-green-600">{user.converted}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-12 sm:w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      user.conversionRate >= 50 ? 'bg-green-500' : 
                                      user.conversionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(user.conversionRate, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs sm:text-sm font-medium">{user.conversionRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-amber-600">{user.interactions}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {user.thisMonth > 0 ? (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                                  +{user.thisMonth}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* User Performance Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card className="border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Inquiries by User</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={data.userPerformance.slice(0, 8)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                            <Bar dataKey="inquiries" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Inquiries" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

                    <Card className="border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate by User</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={data.userPerformance.slice(0, 8)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value: number) => `${value}%`} />
                            <Bar dataKey="conversionRate" fill="#10b981" radius={[0, 4, 4, 0]} name="Conversion Rate" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No user performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Source Performance</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">Inquiries by marketing source</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openDetails('source', 'All Sources', data.sourcePerformance)} className="w-full sm:w-auto">
                    <span className="text-xs sm:text-sm">View All</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.sourcePerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="source" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                      }} 
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Conversion by Source</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Conversion rates per source</CardDescription>
                </div>
              </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.sourcePerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                      outerRadius={100}
                      dataKey="count"
                      label={(props: any) => {
                        const source =
                          props?.payload?.source ??
                          props?.name ??
                          props?.source ??
                          ''
                        const percent = typeof props?.percent === 'number' ? props.percent : 0
                        return `${source}: ${(percent * 100).toFixed(0)}%`
                      }}
                  >
                    {data.sourcePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {data.sourcePerformance.map((item, index) => (
                    <div 
                      key={item.source} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => openDetails('source', item.source, item)}
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.source}</p>
                        <p className="text-xs text-gray-500">{item.count} leads</p>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Pipeline Stages</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Inquiry distribution across stages</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openDetails('stage', 'Pipeline Details', data.stageDistribution)} className="w-full sm:w-auto">
                  <span className="text-xs sm:text-sm">View Details</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                {data.stageDistribution.map((stage, index) => (
                  <Card 
                    key={stage.stage} 
                    className="border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => openDetails('stage', stage.stage, stage)}
                  >
                    <CardContent className="p-3 sm:p-4 text-center">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg flex items-center justify-center mb-2 sm:mb-3"
                        style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}
                      >
                        <span className="text-lg sm:text-xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                          {stage.count}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{stage.stage.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((stage.count / totalSeekers) * 100).toFixed(1)}% of total
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.stageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.stageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50/50 border-b border-gray-200 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Monthly Trends</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">Track growth over time</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => openDetails('metric', 'Trend Analysis', data.monthlyTrends)} className="w-full sm:w-auto">
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-1" /> 
                  <span className="text-xs sm:text-sm">Detailed View</span>
                </Button>
              </div>
            </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                    }} 
                  />
                  <Legend />
                <Line 
                  type="monotone" 
                  dataKey="newSeekers" 
                  stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: '#3b82f6' }}
                    name="New Inquiries"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: '#10b981' }}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

          {/* Trend Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Peak Month</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                      {data.monthlyTrends.reduce((max, item) => item.newSeekers > max.newSeekers ? item : max).month}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Conversions</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                      {data.monthlyTrends.reduce((sum, item) => sum + item.conversions, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Avg. Monthly</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                      {Math.round(data.monthlyTrends.reduce((sum, item) => sum + item.newSeekers, 0) / data.monthlyTrends.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </TabsContent>
    </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}>
        <DialogContent className="max-w-[95vw] md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold">{detailsDialog.title}</DialogTitle>
            <DialogDescription>Detailed breakdown and insights</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            {detailsDialog.type === 'metric' && detailsDialog.data && (
              <div className="space-y-6">
                {/* User Performance Detail */}
                {detailsDialog.data.id && detailsDialog.data.name && detailsDialog.data.inquiries !== undefined ? (
                  <div className="space-y-6">
                    {/* User Header */}
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {detailsDialog.data.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{detailsDialog.data.name}</h3>
                        <p className="text-sm text-gray-500">{detailsDialog.data.email}</p>
                        <Badge variant="outline" className="mt-1">{detailsDialog.data.role}</Badge>
                      </div>
                    </div>

                    {/* User Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl text-center">
                        <p className="text-sm text-blue-600 font-medium">Total Inquiries</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{detailsDialog.data.inquiries}</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-xl text-center">
                        <p className="text-sm text-green-600 font-medium">Converted</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">{detailsDialog.data.converted}</p>
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-xl text-center">
                        <p className="text-sm text-amber-600 font-medium">Interactions</p>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{detailsDialog.data.interactions}</p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-xl text-center">
                        <p className="text-sm text-purple-600 font-medium">This Month</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{detailsDialog.data.thisMonth}</p>
                      </div>
                    </div>

                    {/* Conversion Rate Progress */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
                        <span className="text-lg font-bold">{detailsDialog.data.conversionRate}%</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            detailsDialog.data.conversionRate >= 50 ? 'bg-green-500' : 
                            detailsDialog.data.conversionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(detailsDialog.data.conversionRate, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2">
                        {getPerformanceBadge(detailsDialog.data.conversionRate)}
                      </div>
                    </div>
                  </div>
                ) : typeof detailsDialog.data.value === 'number' ? (
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                      {detailsDialog.data.type === 'rate' ? `${detailsDialog.data.value}%` : detailsDialog.data.value.toLocaleString()}
                    </div>
                    <p className="text-gray-500">{detailsDialog.title}</p>
                    <div className="mt-4">
                      {getPerformanceBadge(detailsDialog.data.value)}
                    </div>
                  </div>
                ) : Array.isArray(detailsDialog.data) && (
                  <div className="space-y-4">
                    {detailsDialog.data.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.month || item.stage || item.source}</span>
                          <div className="flex gap-4">
                            {item.newSeekers !== undefined && <span className="text-blue-600">{item.newSeekers} inquiries</span>}
                            {item.conversions !== undefined && <span className="text-green-600">{item.conversions} conversions</span>}
                            {item.count !== undefined && <span className="text-purple-600">{item.count} total</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detailsDialog.type === 'source' && detailsDialog.data && (
              <div className="space-y-6">
                {Array.isArray(detailsDialog.data) ? (
                  <div className="space-y-4">
                    {detailsDialog.data.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium">{item.source}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{item.count} leads</Badge>
                          <Badge className="bg-green-100 text-green-800">{item.conversionRate}% conversion</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{detailsDialog.data.count}</div>
                    <p className="text-gray-500 mb-4">Total Leads from {detailsDialog.data.source}</p>
                    <div className="text-2xl font-semibold text-green-600">{detailsDialog.data.conversionRate}% Conversion Rate</div>
                  </div>
                )}
              </div>
            )}

            {detailsDialog.type === 'stage' && detailsDialog.data && (
              <div className="space-y-6">
                {Array.isArray(detailsDialog.data) ? (
                  <div className="space-y-4">
                    {detailsDialog.data.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium">{item.stage}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold">{item.count}</span>
                          <span className="text-gray-500">({((item.count / totalSeekers) * 100).toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{detailsDialog.data.count}</div>
                    <p className="text-gray-500 mb-4">Inquiries in {detailsDialog.data.stage} stage</p>
                    <div className="text-xl font-semibold text-purple-600">
                      {((detailsDialog.data.count / totalSeekers) * 100).toFixed(1)}% of pipeline
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
            <Button variant="outline" onClick={() => setDetailsDialog({ ...detailsDialog, open: false })} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
