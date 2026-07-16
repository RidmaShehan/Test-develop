import { prisma } from '@/lib/prisma'
import { ProjectRole } from '@prisma/client'

// Helper to determine a user's role on a specific project
export async function getProjectUserRole(
  projectId: string,
  userId: string,
  globalRole: string
): Promise<ProjectRole | null> {
  const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'DEVELOPER', 'SYSTEM'].includes(globalRole)
  if (isAdmin) {
    return 'OWNER' // Admins bypass all restrictions and act as project Owner
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  })

  if (member) {
    return member.role
  }

  // Fallback: Check if they are the original project creator
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  })

  if (project?.createdById === userId) {
    return 'OWNER'
  }

  return null
}

// Enforce project management permissions (update, delete project details)
export async function canManageProject(
  projectId: string,
  userId: string,
  globalRole: string
): Promise<boolean> {
  const role = await getProjectUserRole(projectId, userId, globalRole)
  return role === 'OWNER'
}

// Enforce member management permissions (add, remove, update member roles)
export async function canManageMembers(
  projectId: string,
  userId: string,
  globalRole: string
): Promise<boolean> {
  const role = await getProjectUserRole(projectId, userId, globalRole)
  return role === 'OWNER' || role === 'MANAGER'
}

// Enforce task assignment permissions (can assign a task to another project member)
export async function canAssignTasks(
  projectId: string,
  userId: string,
  globalRole: string
): Promise<boolean> {
  const role = await getProjectUserRole(projectId, userId, globalRole)
  return role === 'OWNER' || role === 'MANAGER'
}

// Enforce task modification permissions (status, checklists, comments, time entries)
export async function canWriteTask(
  projectId: string,
  userId: string,
  globalRole: string,
  taskDetails?: { createdById: string; assignedToId: string | null }
): Promise<{ canEditAll: boolean; canEditAssigned: boolean }> {
  const role = await getProjectUserRole(projectId, userId, globalRole)

  if (role === 'OWNER' || role === 'MANAGER') {
    return { canEditAll: true, canEditAssigned: true }
  }

  if (role === 'CONTRIBUTOR') {
    return { canEditAll: false, canEditAssigned: true }
  }

  return { canEditAll: false, canEditAssigned: false }
}
