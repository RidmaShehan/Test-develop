import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_PERMISSIONS = [
  // User Management
  { name: 'CREATE_USER' as const, description: 'Create new users' },
  { name: 'READ_USER' as const, description: 'View user information' },
  { name: 'UPDATE_USER' as const, description: 'Update user information' },
  { name: 'DELETE_USER' as const, description: 'Delete users' },
  { name: 'ASSIGN_ROLE' as const, description: 'Assign roles to users' },
  { name: 'MANAGE_USER_ROLES' as const, description: 'Manage user role assignments' },
  
  // Role Management
  { name: 'CREATE_ROLE' as const, description: 'Create new roles' },
  { name: 'READ_ROLE' as const, description: 'View role information' },
  { name: 'UPDATE_ROLE' as const, description: 'Update role information' },
  { name: 'DELETE_ROLE' as const, description: 'Delete roles' },
  { name: 'MANAGE_ROLE_PERMISSIONS' as const, description: 'Manage role permissions' },
  
  // Seeker Management
  { name: 'CREATE_SEEKER' as const, description: 'Create new seekers' },
  { name: 'READ_SEEKER' as const, description: 'View seeker information' },
  { name: 'UPDATE_SEEKER' as const, description: 'Update seeker information' },
  { name: 'DELETE_SEEKER' as const, description: 'Delete seekers' },
  
  // Task Management
  { name: 'CREATE_TASK' as const, description: 'Create new tasks' },
  { name: 'READ_TASK' as const, description: 'View task information' },
  { name: 'UPDATE_TASK' as const, description: 'Update task information' },
  { name: 'DELETE_TASK' as const, description: 'Delete tasks' },
  { name: 'ASSIGN_TASK' as const, description: 'Assign tasks to users' },
  
  // Program Management
  { name: 'CREATE_PROGRAM' as const, description: 'Create new programs' },
  { name: 'READ_PROGRAM' as const, description: 'View program information' },
  { name: 'UPDATE_PROGRAM' as const, description: 'Update program information' },
  { name: 'DELETE_PROGRAM' as const, description: 'Delete programs' },
  
  // Campaign Management
  { name: 'CREATE_CAMPAIGN' as const, description: 'Create new campaigns' },
  { name: 'READ_CAMPAIGN' as const, description: 'View campaign information' },
  { name: 'UPDATE_CAMPAIGN' as const, description: 'Update campaign information' },
  { name: 'DELETE_CAMPAIGN' as const, description: 'Delete campaigns' },
  { name: 'MANAGE_CAMPAIGN_ANALYTICS' as const, description: 'Manage campaign analytics' },
  
  // Inquiry Management
  { name: 'CREATE_INQUIRY' as const, description: 'Create new inquiries' },
  { name: 'READ_INQUIRY' as const, description: 'View inquiry information' },
  { name: 'UPDATE_INQUIRY' as const, description: 'Update inquiry information' },
  { name: 'DELETE_INQUIRY' as const, description: 'Delete inquiries' },
  { name: 'MANAGE_INQUIRY_INTERACTIONS' as const, description: 'Manage inquiry interactions' },
  
  // Reports & Analytics
  { name: 'READ_REPORTS' as const, description: 'View reports' },
  { name: 'EXPORT_REPORTS' as const, description: 'Export reports' },
  { name: 'VIEW_ANALYTICS' as const, description: 'View analytics data' },
  
  // System Settings
  { name: 'READ_SETTINGS' as const, description: 'View system settings' },
  { name: 'UPDATE_SETTINGS' as const, description: 'Update system settings' },
  { name: 'MANAGE_SYSTEM_CONFIG' as const, description: 'Manage system configuration' },
  
  // Special Permissions
  { name: 'DELETE_ADMINISTRATOR' as const, description: 'Delete administrator users' },
  { name: 'MANAGE_ALL_USERS' as const, description: 'Manage all users in the system' },
  { name: 'SYSTEM_ADMINISTRATION' as const, description: 'Full system administration access' }
]

const ROLE_PERMISSIONS = {
  ADMINISTRATOR: [
    // All permissions
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
}

async function main() {
  console.log('🌱 Seeding roles and permissions...')

  try {
    // Create permissions
    console.log('Creating permissions...')
    for (const permission of DEFAULT_PERMISSIONS) {
      await prisma.permissionModel.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission
      })
    }

    // Create roles
    console.log('Creating roles...')
    for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {
          description: getRoleDescription(roleName),
          isActive: true
        },
        create: {
          name: roleName,
          description: getRoleDescription(roleName),
          isActive: true
        }
      })

      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      })

      // Add permissions to role
      for (const permissionName of permissions) {
        const permission = await prisma.permissionModel.findUnique({
          where: { name: permissionName as any }
        })

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          })
        }
      }

      console.log(`✅ Created role: ${roleName} with ${permissions.length} permissions`)
    }

    console.log('🎉 Roles and permissions seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function getRoleDescription(roleName: string): string {
  const descriptions = {
    ADMINISTRATOR: 'Full system access with ability to delete administrators',
    ADMIN: 'Full system access but cannot delete administrators',
    DEVELOPER: 'Full system access for development purposes',
    COORDINATOR: 'Limited access to inquiries, tasks, and basic user management',
    VIEWER: 'Read-only access to system data'
  }
  return descriptions[roleName as keyof typeof descriptions] || ''
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
