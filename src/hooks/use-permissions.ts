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
  canCreate,
  canRead,
  canUpdate,
  canDelete,
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
    return user.permissions ?? []
  }, [user])

  return {
    permissions,
    hasPermission: (permission: string) => hasPermission(permissions, permission),
    hasAnyPermission: (requiredPermissions: string[]) => hasAnyPermission(permissions, requiredPermissions),
    hasAllPermissions: (requiredPermissions: string[]) => hasAllPermissions(permissions, requiredPermissions),
    hasCategoryPermission: (category: string) => hasCategoryPermission(permissions, category as keyof typeof PERMISSION_CATEGORIES),
    canAccessFeature: (feature: string) => canAccessFeature(permissions, feature),
    canPerformAction: (action: string, resource: string) => canPerformAction(permissions, action, resource),

    // Professional CRUD helpers - recommended way
    canCreate: (resource: string) => canCreate(permissions, resource),
    canRead: (resource: string) => canRead(permissions, resource),
    canUpdate: (resource: string) => canUpdate(permissions, resource),
    canDelete: (resource: string) => canDelete(permissions, resource),

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
    canPerformAction,
    canCreate,
    canRead,
    canUpdate,
    canDelete
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
  } else if (action === 'create' && resource) {
    hasAccess = canCreate(resource)
  } else if (action === 'read' && resource) {
    hasAccess = canRead(resource)
  } else if (action === 'update' && resource) {
    hasAccess = canUpdate(resource)
  } else if (action === 'delete' && resource) {
    hasAccess = canDelete(resource)
  }

  return hasAccess ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback)
}
