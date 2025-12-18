'use client'

import React, { useMemo } from 'react'
import { useAuth } from './use-auth'
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  hasCategoryPermission,
  canAccessFeature,
  canPerformAction,
  getUserPermissions,
  isAdmin,
  canManageUsers,
  canManageRoles,
  canManagePrograms,
  canManageSeekers,
  canManageTasks,
  canViewReports,
  canExportReports,
  PERMISSION_CATEGORIES
} from '@/lib/permissions'

export function usePermissions() {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user) return []
    
    // For now, we'll use the user's primary role to determine permissions
    // In a full implementation, you'd fetch the user's roles and their permissions
    const userRole = user.role
    
    // Map role to permissions (this should ideally come from the database)
    const rolePermissions: Record<string, string[]> = {
      'ADMINISTRATOR': [
        'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'MANAGE_USER_ROLES',
        'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
        'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM', 'MANAGE_PROGRAM_LEVELS',
        'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER', 'MANAGE_SEEKER_INTERACTIONS',
        'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
        'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN',
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
        'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
        'VIEW_SYSTEM_SETTINGS', 'MANAGE_SYSTEM_SETTINGS', 'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
      ],
      'DEVELOPER': [
        'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'MANAGE_USER_ROLES',
        'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
        'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM', 'MANAGE_PROGRAM_LEVELS',
        'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER', 'MANAGE_SEEKER_INTERACTIONS',
        'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
        'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN',
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
        'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
        'VIEW_SYSTEM_SETTINGS', 'MANAGE_SYSTEM_SETTINGS', 'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
      ],
      'ADMIN': [
        'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'MANAGE_USER_ROLES',
        'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
        'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM', 'MANAGE_PROGRAM_LEVELS',
        'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER', 'MANAGE_SEEKER_INTERACTIONS',
        'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
        'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN',
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
        'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
        'VIEW_SYSTEM_SETTINGS', 'MANAGE_SYSTEM_SETTINGS'
      ],
      'MANAGER': [
        'READ_USER', 'READ_ROLE',
        'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM', 'MANAGE_PROGRAM_LEVELS',
        'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER', 'MANAGE_SEEKER_INTERACTIONS',
        'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
        'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN',
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
        'VIEW_REPORTS', 'EXPORT_REPORTS'
      ],
      'MARKETING': [
        'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER', 'MANAGE_SEEKER_INTERACTIONS',
        'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
        'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN',
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
        'READ_PROGRAM', 'VIEW_REPORTS'
      ],
      'COORDINATOR': [
        'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER', 'MANAGE_SEEKER_INTERACTIONS',
        'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
        'READ_CAMPAIGN',
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE',
        'READ_PROGRAM', 'VIEW_REPORTS'
      ],
      'VIEWER': [
        'READ_USER', 'READ_ROLE', 'READ_PROGRAM', 'READ_SEEKER', 'READ_TASK', 'READ_CAMPAIGN', 
        'READ_NOTEBOOK', 'READ_NOTE',
        'VIEW_REPORTS'
      ]
    }

    return rolePermissions[userRole] || []
  }, [user])

  return {
    permissions,
    hasPermission: (permission: string) => hasPermission(permissions, permission),
    hasAnyPermission: (requiredPermissions: string[]) => hasAnyPermission(permissions, requiredPermissions),
    hasAllPermissions: (requiredPermissions: string[]) => hasAllPermissions(permissions, requiredPermissions),
    hasCategoryPermission: (category: string) => hasCategoryPermission(permissions, category as keyof typeof PERMISSION_CATEGORIES),
    canAccessFeature: (feature: string) => canAccessFeature(permissions, feature),
    canPerformAction: (action: string, resource: string) => canPerformAction(permissions, action, resource),
    isAdmin: () => isAdmin(permissions),
    canManageUsers: () => canManageUsers(permissions),
    canManageRoles: () => canManageRoles(permissions),
    canManagePrograms: () => canManagePrograms(permissions),
    canManageSeekers: () => canManageSeekers(permissions),
    canManageTasks: () => canManageTasks(permissions),
    canViewReports: () => canViewReports(permissions),
    canExportReports: () => canExportReports(permissions),
  }
}

// Higher-order component for permission-based rendering
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions: string[],
  fallback?: React.ComponentType<T>
) {
  return function PermissionWrappedComponent(props: T) {
    const { hasAllPermissions } = usePermissions()
    
    if (hasAllPermissions(requiredPermissions)) {
      return React.createElement(Component, props)
    }
    
    if (fallback) {
      return React.createElement(fallback, props)
    }
    
    return null
  }
}

// Component for conditional rendering based on permissions
interface PermissionGateProps {
  permissions?: string[]
  anyPermission?: string[]
  category?: string
  feature?: string
  action?: string
  resource?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ 
  permissions = [], 
  anyPermission = [], 
  category, 
  feature, 
  action, 
  resource, 
  fallback = null, 
  children 
}: PermissionGateProps) {
  const { 
    hasAllPermissions, 
    hasAnyPermission, 
    hasCategoryPermission, 
    canAccessFeature, 
    canPerformAction 
  } = usePermissions()

  let hasAccess = false

  if (permissions.length > 0) {
    hasAccess = hasAllPermissions(permissions)
  } else if (anyPermission.length > 0) {
    hasAccess = hasAnyPermission(anyPermission)
  } else if (category) {
    hasAccess = hasCategoryPermission(category)
  } else if (feature) {
    hasAccess = canAccessFeature(feature)
  } else if (action && resource) {
    hasAccess = canPerformAction(action, resource)
  }

  return hasAccess ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback)
}
