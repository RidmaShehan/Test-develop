import { Permission } from '@prisma/client'

// Permission categories for easier management
export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: [
    'CREATE_USER',
    'READ_USER', 
    'UPDATE_USER',
    'DELETE_USER',
    'MANAGE_USER_ROLES'
  ],
  ROLE_MANAGEMENT: [
    'CREATE_ROLE',
    'READ_ROLE',
    'UPDATE_ROLE', 
    'DELETE_ROLE',
    'MANAGE_ROLE_PERMISSIONS'
  ],
  PROGRAM_MANAGEMENT: [
    'CREATE_PROGRAM',
    'READ_PROGRAM',
    'UPDATE_PROGRAM',
    'DELETE_PROGRAM',
    'MANAGE_PROGRAM_LEVELS'
  ],
  SEEKER_MANAGEMENT: [
    'CREATE_SEEKER',
    'READ_SEEKER',
    'UPDATE_SEEKER',
    'DELETE_SEEKER',
    'MANAGE_SEEKER_INTERACTIONS'
  ],
  TASK_MANAGEMENT: [
    'CREATE_TASK',
    'READ_TASK',
    'UPDATE_TASK',
    'DELETE_TASK',
    'ASSIGN_TASK'
  ],
  CAMPAIGN_MANAGEMENT: [
    'CREATE_CAMPAIGN',
    'READ_CAMPAIGN',
    'UPDATE_CAMPAIGN',
    'DELETE_CAMPAIGN',
    'MANAGE_CAMPAIGN_SEEKERS'
  ],
  REPORTS: [
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_ANALYTICS'
  ],
  SYSTEM: [
    'VIEW_SYSTEM_SETTINGS',
    'MANAGE_SYSTEM_SETTINGS'
  ]
} as const

// Default role permissions mapping
export const DEFAULT_ROLE_PERMISSIONS = {
  ADMINISTRATOR: [
    // All permissions including special ones
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ],
  ADMIN: [
    // All permissions except deleting administrators
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ],
  DEVELOPER: [
    // Same as administrator for development purposes
    'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER', 'ASSIGN_ROLE', 'MANAGE_USER_ROLES',
    'CREATE_ROLE', 'READ_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE', 'MANAGE_ROLE_PERMISSIONS',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'CREATE_PROGRAM', 'READ_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM',
    'CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN', 'MANAGE_CAMPAIGN_ANALYTICS',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'EXPORT_REPORTS', 'VIEW_ANALYTICS',
    'READ_SETTINGS', 'UPDATE_SETTINGS', 'MANAGE_SYSTEM_CONFIG',
    'DELETE_ADMINISTRATOR', 'MANAGE_ALL_USERS', 'SYSTEM_ADMINISTRATION'
  ],
  COORDINATOR: [
    // Limited to inquiries, tasks, and basic user management
    'READ_USER', 'UPDATE_USER',
    'CREATE_SEEKER', 'READ_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER',
    'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'ASSIGN_TASK',
    'READ_PROGRAM',
    'READ_CAMPAIGN',
    'CREATE_INQUIRY', 'READ_INQUIRY', 'UPDATE_INQUIRY', 'DELETE_INQUIRY', 'MANAGE_INQUIRY_INTERACTIONS',
    'READ_REPORTS', 'VIEW_ANALYTICS'
  ],
  VIEWER: [
    // Read-only access
    'READ_USER', 'READ_SEEKER', 'READ_TASK', 'READ_PROGRAM', 'READ_CAMPAIGN', 
    'READ_INQUIRY', 'READ_REPORTS', 'VIEW_ANALYTICS'
  ]
} as const

// Permission checking utilities
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}

export function hasCategoryPermission(userPermissions: string[], category: keyof typeof PERMISSION_CATEGORIES): boolean {
  return hasAnyPermission(userPermissions, [...PERMISSION_CATEGORIES[category]])
}

// Check if user can access a specific feature
export function canAccessFeature(userPermissions: string[], feature: string): boolean {
  const featurePermissions: Record<string, string[]> = {
    'user-management': ['READ_USER', 'READ_ROLE'],
    'programs': ['READ_PROGRAM'],
    'seekers': ['READ_SEEKER'],
    'tasks': ['READ_TASK'],
    'campaigns': ['READ_CAMPAIGN'],
    'reports': ['VIEW_REPORTS'],
    'settings': ['VIEW_SYSTEM_SETTINGS']
  }

  const requiredPermissions = featurePermissions[feature] || []
  return hasAnyPermission(userPermissions, requiredPermissions)
}

// Check if user can perform an action
export function canPerformAction(userPermissions: string[], action: string, resource: string): boolean {
  const permission = `${action.toUpperCase()}_${resource.toUpperCase()}`
  return hasPermission(userPermissions, permission)
}

// Get user's effective permissions from roles
export function getUserPermissions(userRoles: Array<{ role: { permissions: Array<{ permission: { name: string } }> } }>): string[] {
  const permissions = new Set<string>()
  
  userRoles.forEach(userRole => {
    userRole.role.permissions.forEach(rolePermission => {
      permissions.add(rolePermission.permission.name)
    })
  })
  
  return Array.from(permissions)
}

// Check if user is admin (has all permissions)
export function isAdmin(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'CREATE_USER') && 
         hasPermission(userPermissions, 'DELETE_USER')
}

// Check if user can manage users
export function canManageUsers(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, ['CREATE_USER', 'UPDATE_USER', 'DELETE_USER'])
}

// Check if user can manage roles
export function canManageRoles(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, ['CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE'])
}

// Check if user can manage programs
export function canManagePrograms(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, ['CREATE_PROGRAM', 'UPDATE_PROGRAM', 'DELETE_PROGRAM'])
}

// Check if user can manage seekers
export function canManageSeekers(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, ['CREATE_SEEKER', 'UPDATE_SEEKER', 'DELETE_SEEKER'])
}

// Check if user can manage tasks
export function canManageTasks(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, ['CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK'])
}

// Check if user can view reports
export function canViewReports(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'VIEW_REPORTS')
}

// Check if user can export reports
export function canExportReports(userPermissions: string[]): boolean {
  return hasPermission(userPermissions, 'EXPORT_REPORTS')
}

// Check if user can manage campaigns
export function canManageCampaigns(userPermissions: string[]): boolean {
  return hasAnyPermission(userPermissions, ['CREATE_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN'])
}
