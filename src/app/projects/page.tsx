'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProjectDashboard } from '@/components/projects/project-dashboard'
import { ProjectForm } from '@/components/projects/project-form'
import { DealPipeline } from '@/components/deals/deal-pipeline'
import type { Project } from '@/components/projects/project-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTheme } from '@/lib/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { useProjectNotificationService } from '@/services/project-notification-service'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function ProjectsPage() {
  const { compactMode } = useTheme()
  const { user, loading } = useAuth()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Initialize project notification service
  useProjectNotificationService({ userId: user?.id })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to sign-in
  }

  const handleCreateProject = () => {
    setEditingProject(null)
    setShowProjectForm(true)
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowProjectForm(true)
  }

  const handleSaveProject = async (projectData: Project) => {
    setFormLoading(true)
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects'
      const method = editingProject ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        setShowProjectForm(false)
        setEditingProject(null)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save project')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Failed to save project')
    } finally {
      setFormLoading(false)
    }
  }

  const handleCreateDeal = () => {
    setShowDealForm(true)
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "transition-all duration-300",
        compactMode ? "space-y-4" : "space-y-6"
      )}>
        <div>
          <h1 className={cn(
            "font-bold text-foreground",
            compactMode ? "text-xl" : "text-2xl"
          )}>Project Management</h1>
          <p className={cn(
            "text-muted-foreground",
            compactMode ? "text-sm" : "text-base"
          )}>Manage projects, tasks, and deals in one place</p>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">Projects & Tasks</TabsTrigger>
            <TabsTrigger value="deals">Deal Pipeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="space-y-6">
            <ProjectDashboard onCreateProject={handleCreateProject} />
          </TabsContent>
          
          <TabsContent value="deals" className="space-y-6">
            <DealPipeline onCreateDeal={handleCreateDeal} />
          </TabsContent>
        </Tabs>

        {/* Project Form Dialog */}
        <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              onSave={handleSaveProject}
              onCancel={() => {
                setShowProjectForm(false)
                setEditingProject(null)
              }}
              loading={formLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Deal Form Dialog - Placeholder for now */}
        <Dialog open={showDealForm} onOpenChange={setShowDealForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Deal creation form will be implemented here.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This will include fields for deal title, value, stage, client, and more.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
