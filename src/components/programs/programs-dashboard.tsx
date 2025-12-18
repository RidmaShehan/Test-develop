'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Settings, Plus, BookOpen, Building2, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgramsTable } from './programs-table'
import { LevelsTable } from './levels-table'
import { NewProgramDialog } from './new-program-dialog'
import { NewLevelDialog } from './new-level-dialog'
import { PermissionGate } from '@/hooks/use-permissions'

interface ProgramStats {
  totalPrograms: number
  totalLevels: number
  totalSeekers: number
  upcomingIntakes: number
}

export function ProgramsDashboard() {
  const [activeTab, setActiveTab] = useState('programs')
  const [showNewProgramDialog, setShowNewProgramDialog] = useState(false)
  const [showNewLevelDialog, setShowNewLevelDialog] = useState(false)
  const [stats, setStats] = useState<ProgramStats>({
    totalPrograms: 0,
    totalLevels: 0,
    totalSeekers: 0,
    upcomingIntakes: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [programsRes, levelsRes] = await Promise.all([
        fetch('/api/programs'),
        fetch('/api/levels')
      ])
      
      if (programsRes.ok && levelsRes.ok) {
        const programs = await programsRes.json()
        const levels = await levelsRes.json()
        
        const now = new Date()
        const upcomingIntakes = programs.filter((p: any) => 
          p.nextIntakeDate && new Date(p.nextIntakeDate) > now
        ).length
        
        const totalSeekers = programs.reduce((sum: number, p: any) => 
          sum + (p._count?.seekers || 0), 0
        )
        
        setStats({
          totalPrograms: programs.length,
          totalLevels: levels.length,
          totalSeekers,
          upcomingIntakes
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-emerald-600 font-medium">Programs</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.totalPrograms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Levels</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLevels}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/30">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-purple-600 font-medium">Interested</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalSeekers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/30">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-amber-600 font-medium">Upcoming</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.upcomingIntakes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
            <PermissionGate permissions={['READ_PROGRAM']}>
              <TabsTrigger 
                value="programs" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg py-2.5 px-4 text-sm font-medium flex items-center gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Programs</span>
                <span className="sm:hidden">Programs</span>
                <Badge variant="secondary" className="ml-1 text-xs">{stats.totalPrograms}</Badge>
              </TabsTrigger>
            </PermissionGate>
            <PermissionGate permissions={['MANAGE_PROGRAM_LEVELS']}>
              <TabsTrigger 
                value="levels" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 rounded-lg py-2.5 px-4 text-sm font-medium flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Level Management</span>
                <span className="sm:hidden">Levels</span>
                <Badge variant="secondary" className="ml-1 text-xs">{stats.totalLevels}</Badge>
              </TabsTrigger>
            </PermissionGate>
          </TabsList>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {activeTab === 'programs' && (
              <PermissionGate permissions={['CREATE_PROGRAM']}>
                <Button 
                  onClick={() => setShowNewProgramDialog(true)} 
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Program</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </PermissionGate>
            )}
            {activeTab === 'levels' && (
              <PermissionGate permissions={['MANAGE_PROGRAM_LEVELS']}>
                <Button 
                  onClick={() => setShowNewLevelDialog(true)} 
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Level</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </PermissionGate>
            )}
          </div>
        </div>

        {/* Programs Tab */}
        <PermissionGate permissions={['READ_PROGRAM']}>
          <TabsContent value="programs" className="space-y-4 mt-0">
            <ProgramsTable onDataChange={fetchStats} />
          </TabsContent>
        </PermissionGate>

        {/* Level Management Tab */}
        <PermissionGate permissions={['MANAGE_PROGRAM_LEVELS']}>
          <TabsContent value="levels" className="space-y-4 mt-0">
            <LevelsTable />
          </TabsContent>
        </PermissionGate>
      </Tabs>

      {/* Dialogs */}
      <NewProgramDialog 
        open={showNewProgramDialog} 
        onOpenChange={setShowNewProgramDialog}
        onSuccess={fetchStats}
      />
      <NewLevelDialog 
        open={showNewLevelDialog} 
        onOpenChange={setShowNewLevelDialog}
        onLevelCreated={fetchStats}
      />
    </div>
  )
}
