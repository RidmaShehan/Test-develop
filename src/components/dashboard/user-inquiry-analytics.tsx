'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, Calendar } from 'lucide-react'
import { safeJsonParse } from '@/lib/utils'

interface UserInquiryStat {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  totalInquiries: number
  thisWeekInquiries: number
  thisMonthInquiries: number
}

interface DashboardData {
  userInquiryStats: UserInquiryStat[]
}

export function UserInquiryAnalytics() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserInquiryStats()
  }, [])

  const fetchUserInquiryStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData: DashboardData = await safeJsonParse(response)
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Error fetching user inquiry stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">User Inquiry Analytics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.userInquiryStats || data.userInquiryStats.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50/50 border-b border-gray-200">
          <CardTitle className="text-lg font-semibold text-gray-900">User Inquiry Analytics</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No user data available</p>
            <p className="text-xs text-gray-400">User inquiry statistics will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedUsers = [...data.userInquiryStats].sort((a, b) => b.totalInquiries - a.totalInquiries)

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            User Inquiry Analytics
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {sortedUsers.length} {sortedUsers.length === 1 ? 'user' : 'users'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-gray-50/50">
                <TableHead className="font-semibold text-gray-900">User</TableHead>
                <TableHead className="font-semibold text-gray-900">Role</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Total</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">This Week</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">This Month</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.userId} className="hover:bg-gray-50/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{user.userName}</span>
                      <span className="text-xs text-gray-500 truncate">{user.userEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`text-xs font-medium px-2 py-0.5 ${
                        user.userRole === 'ADMIN' || user.userRole === 'ADMINISTRATOR' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {user.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-gray-900">{user.totalInquiries.toLocaleString()}</span>
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium text-gray-700">{user.thisWeekInquiries.toLocaleString()}</span>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium text-gray-700">{user.thisMonthInquiries.toLocaleString()}</span>
                      <Calendar className="h-4 w-4 text-green-500" />
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

