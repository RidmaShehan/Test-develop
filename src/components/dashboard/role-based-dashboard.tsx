'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Megaphone,
} from 'lucide-react'
import { DashboardStats } from './dashboard-stats'
import { UserInquiryAnalytics } from './user-inquiry-analytics'
import { FollowUpComplianceCard } from './follow-up-compliance-card'
import type { DashboardStatsData } from './dashboard-stats'
import type { UserInquiryStat } from './user-inquiry-analytics'
import {
  CoordinatorAssignedCampaigns,
  type CoordinatorAssignedCampaign,
} from './coordinator-assigned-campaigns'

interface RoleBasedDashboardProps {
  className?: string
  stats?: DashboardStatsData | null
  userInquiryStats?: UserInquiryStat[] | null
  assignedCampaigns?: CoordinatorAssignedCampaign[] | null
  loading?: boolean
  error?: string | null
}

export function RoleBasedDashboard({
  className,
  stats,
  userInquiryStats,
  assignedCampaigns,
  loading,
  error,
}: RoleBasedDashboardProps) {
  const { user } = useAuth()
  const { isAdmin, canManageUsers, canManageSeekers, canViewReports } = usePermissions()

  const role = user?.role || 'VIEWER'
  
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMINISTRATOR': return { label: 'Administrator', color: 'bg-red-100 text-red-700' }
      case 'ADMIN': return { label: 'Admin', color: 'bg-orange-100 text-orange-700' }
      case 'DEVELOPER': return { label: 'Developer', color: 'bg-purple-100 text-purple-700' }
      case 'COORDINATOR': return { label: 'Coordinator', color: 'bg-blue-100 text-blue-700' }
      case 'VIEWER': return { label: 'Viewer', color: 'bg-gray-100 text-gray-700' }
      default: return { label: role, color: 'bg-gray-100 text-gray-700' }
    }
  }

  const roleInfo = getRoleDisplay(role)

  return (
    <div className={className}>
      {/* Role Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Badge className={roleInfo.color} variant="secondary">
              {roleInfo.label}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            {role === 'ADMINISTRATOR' || role === 'ADMIN' 
              ? 'System overview and team performance' 
              : role === 'COORDINATOR' 
                ? 'Inquiry and task management overview' 
                : 'Personal performance summary'}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">Welcome back,</div>
          <div className="font-medium text-gray-900">{user?.name}</div>
        </div>
      </div>

      {/* Role-specific Dashboard Content */}
      <div className="space-y-8">
        {role === 'COORDINATOR' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-gray-900">My assigned campaigns</h2>
            </div>
            <p className="text-sm text-gray-600">
              Campaigns where you are set as coordinator. Each card shows status, creative, and key
              analytics.
            </p>
            <CoordinatorAssignedCampaigns
              campaigns={assignedCampaigns ?? []}
              loading={loading}
            />
          </div>
        )}

        {/* Core Stats - Available to all roles */}
        <DashboardStats stats={stats} loading={loading} error={error} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Analytics - Role dependent */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Analytics for Coordinators and Viewers */}
            {(role === 'COORDINATOR' || role === 'VIEWER') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    My Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserInquiryAnalytics
                    userInquiryStats={userInquiryStats}
                    loading={loading}
                    error={error}
                  />
                </CardContent>
              </Card>
            )}

            {/* Team Overview for Admins */}
            {(isAdmin() || canManageUsers()) && (
              <>
                <FollowUpComplianceCard />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-500 mb-1">Active Coordinators</div>
                        <div className="text-4xl font-semibold text-gray-900">12</div>
                        <div className="text-emerald-600 text-sm flex items-center gap-1 mt-2">
                          <TrendingUp className="h-4 w-4" /> +2 this month
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-500 mb-1">Avg. Conversion Rate</div>
                        <div className="text-4xl font-semibold text-gray-900">24%</div>
                        <div className="text-emerald-600 text-sm flex items-center gap-1 mt-2">
                          <TrendingUp className="h-4 w-4" /> +3% from last month
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canManageSeekers() && (
                  <button 
                    onClick={() => window.location.href = '/inquiries/new'}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">Add New Inquiry</div>
                      <div className="text-xs text-gray-500">Quick entry form</div>
                    </div>
                  </button>
                )}

                <button 
                  onClick={() => window.location.href = '/tasks'}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">View My Tasks</div>
                    <div className="text-xs text-gray-500">Check assignments</div>
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Open Inquiries</div>
                    <Badge variant="secondary">47</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Pending Tasks</div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">This Week's Goal</div>
                    <div className="text-emerald-600 font-medium">83% complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}