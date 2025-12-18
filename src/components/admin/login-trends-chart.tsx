'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users } from 'lucide-react'

interface LoginTrend {
  date: string
  logins: number
  logouts: number
}

interface LoginTrendsChartProps {
  trends: LoginTrend[]
  title?: string
  description?: string
}

export function LoginTrendsChart({ 
  trends, 
  title = "Login Trends", 
  description = "Daily login and logout activity" 
}: LoginTrendsChartProps) {
  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Activity Data</h3>
              <p className="text-gray-500 mb-1">No login or logout activity found</p>
              <p className="text-sm text-gray-400">Try selecting a different time period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(
    ...trends.map(t => Math.max(t.logins, t.logouts))
  )


  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Modern Chart */}
          <div className="h-72 overflow-x-auto">
            <div className="flex items-end space-x-3 h-full min-w-max pb-6">
              {trends.map((trend, index) => {
                const loginHeight = maxValue > 0 ? (trend.logins / maxValue) * 240 : 0
                const logoutHeight = maxValue > 0 ? (trend.logouts / maxValue) * 240 : 0
                const isToday = new Date(trend.date).toDateString() === new Date().toDateString()
                
                return (
                  <div key={trend.date} className="flex flex-col items-center space-y-3 group relative">
                    {/* Modern Bars Container */}
                    <div className="flex items-end space-x-1 relative">
                      {/* Login Bar - Modern Design */}
                      <div 
                        className="w-6 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer"
                        style={{ height: `${Math.max(loginHeight, 4)}px` }}
                        title={`${new Date(trend.date).toLocaleDateString()}: ${trend.logins} logins`}
                      >
                        {loginHeight > 30 && (
                          <div className="flex items-center justify-center h-full text-white text-xs font-semibold">
                            {trend.logins}
                          </div>
                        )}
                      </div>
                      
                      {/* Logout Bar - Modern Design */}
                      <div 
                        className="w-6 bg-gradient-to-t from-rose-500 to-rose-400 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer"
                        style={{ height: `${Math.max(logoutHeight, 4)}px` }}
                        title={`${new Date(trend.date).toLocaleDateString()}: ${trend.logouts} logouts`}
                      >
                        {logoutHeight > 30 && (
                          <div className="flex items-center justify-center h-full text-white text-xs font-semibold">
                            {trend.logouts}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Modern Date Label */}
                    <div className={`text-xs font-medium transform -rotate-45 origin-left whitespace-nowrap transition-colors duration-200 ${
                      isToday 
                        ? 'text-blue-600 font-semibold' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      {new Date(trend.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    
                    {/* Modern Hover Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs font-medium">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-gray-700">{trend.logins} logins</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                          <span className="text-gray-700">{trend.logouts} logouts</span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {new Date(trend.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Modern Legend */}
          <div className="flex items-center justify-center space-x-8 py-2">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
              <div className="w-3 h-3 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-full shadow-sm"></div>
              <span className="text-sm font-semibold text-gray-700">Logins</span>
            </div>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
              <div className="w-3 h-3 bg-gradient-to-t from-rose-500 to-rose-400 rounded-full shadow-sm"></div>
              <span className="text-sm font-semibold text-gray-700">Logouts</span>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
}
