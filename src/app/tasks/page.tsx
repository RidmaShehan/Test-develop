'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Kanban, List, Calendar } from 'lucide-react'

// Lazy-load heavy tab content to reduce INP and initial JS (only active tab loads first)
function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[320px]" aria-hidden>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  )
}

const FollowUpsView = dynamic(
  () => import('@/components/tasks/follow-ups-view').then((m) => ({ default: m.FollowUpsView })),
  { loading: TabLoader, ssr: false }
)

const KanbanBoard = dynamic(
  () => import('@/components/tasks/kanban-board').then((m) => ({ default: m.KanbanBoard })),
  { loading: TabLoader, ssr: false }
)

const TasksInbox = dynamic(
  () => import('@/components/tasks/tasks-inbox').then((m) => ({ default: m.TasksInbox })),
  { loading: TabLoader, ssr: false }
)

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-border/60">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage and track all your tasks and follow-ups</p>
        </div>

        <Tabs defaultValue="followups" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="followups" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Follow-ups</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center space-x-2">
              <Kanban className="h-4 w-4" />
              <span>Kanban Board</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>Tasks Inbox</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followups" className="space-y-6 mt-6">
            <FollowUpsView />
          </TabsContent>
          
          <TabsContent value="kanban" className="space-y-6 mt-6">
            <KanbanBoard />
          </TabsContent>
          
          <TabsContent value="inbox" className="space-y-6 mt-6">
            <TasksInbox />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
