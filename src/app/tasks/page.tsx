import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TasksInbox } from '@/components/tasks/tasks-inbox'
import { FollowUpsView } from '@/components/tasks/follow-ups-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Kanban, List, Calendar } from 'lucide-react'

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Tasks</h1>
          <p className="text-sm text-gray-600">Manage and track all your tasks and follow-ups</p>
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
