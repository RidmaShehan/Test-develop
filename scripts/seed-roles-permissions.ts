import { PrismaClient, Permission } from '@prisma/client'

const prisma = new PrismaClient()

// Define all permissions with their descriptions
const PERMISSIONS_DATA = [
  // User Management
  { name: 'CREATE_USER', description: 'Create new users in the system' },
  { name: 'READ_USER', description: 'View user information' },
  { name: 'UPDATE_USER', description: 'Update user information' },
  { name: 'DELETE_USER', description: 'Delete users from the system' },
  { name: 'ASSIGN_ROLE', description: 'Assign roles to users' },
  { name: 'MANAGE_USER_ROLES', description: 'Manage user role assignments' },
  
  // Role Management
  { name: 'CREATE_ROLE', description: 'Create new roles' },
  { name: 'READ_ROLE', description: 'View role information' },
  { name: 'UPDATE_ROLE', description: 'Update role information and permissions' },
  { name: 'DELETE_ROLE', description: 'Delete roles from the system' },
  { name: 'MANAGE_ROLE_PERMISSIONS', description: 'Manage permissions for roles' },
  
  // Seeker Management
  { name: 'CREATE_SEEKER', description: 'Create new seekers' },
  { name: 'READ_SEEKER', description: 'View seeker information' },
  { name: 'UPDATE_SEEKER', description: 'Update seeker information' },
  { name: 'DELETE_SEEKER', description: 'Delete seekers from the system' },
  
  // Task Management
  { name: 'CREATE_TASK', description: 'Create new tasks' },
  { name: 'READ_TASK', description: 'View task information' },
  { name: 'UPDATE_TASK', description: 'Update task information' },
  { name: 'DELETE_TASK', description: 'Delete tasks from the system' },
  { name: 'ASSIGN_TASK', description: 'Assign tasks to users' },
  
  // Program Management
  { name: 'CREATE_PROGRAM', description: 'Create new programs' },
  { name: 'READ_PROGRAM', description: 'View program information' },
  { name: 'UPDATE_PROGRAM', description: 'Update program information' },
  { name: 'DELETE_PROGRAM', description: 'Delete programs from the system' },
  
  // Campaign Management
  { name: 'CREATE_CAMPAIGN', description: 'Create new marketing campaigns' },
  { name: 'READ_CAMPAIGN', description: 'View campaign information' },
  { name: 'UPDATE_CAMPAIGN', description: 'Update campaign information' },
  { name: 'DELETE_CAMPAIGN', description: 'Delete campaigns from the system' },
  { name: 'MANAGE_CAMPAIGN_ANALYTICS', description: 'Manage campaign analytics and metrics' },
  
  // Inquiry Management
  { name: 'CREATE_INQUIRY', description: 'Create new inquiries' },
  { name: 'READ_INQUIRY', description: 'View inquiry information' },
  { name: 'UPDATE_INQUIRY', description: 'Update inquiry information' },
  { name: 'DELETE_INQUIRY', description: 'Delete inquiries from the system' },
  { name: 'MANAGE_INQUIRY_INTERACTIONS', description: 'Manage inquiry interactions and communications' },
  
  // Reports & Analytics
  { name: 'READ_REPORTS', description: 'View reports and analytics' },
  { name: 'EXPORT_REPORTS', description: 'Export reports to various formats' },
  { name: 'VIEW_ANALYTICS', description: 'View advanced analytics and insights' },
  
  // System Settings
  { name: 'READ_SETTINGS', description: 'View system settings' },
  { name: 'UPDATE_SETTINGS', description: 'Update system settings' },
  { name: 'MANAGE_SYSTEM_CONFIG', description: 'Manage system configuration and advanced settings' },
  
  // Project Management
  { name: 'CREATE_PROJECT', description: 'Create new projects' },
  { name: 'READ_PROJECT', description: 'View project information' },
  { name: 'UPDATE_PROJECT', description: 'Update project information' },
  { name: 'DELETE_PROJECT', description: 'Delete projects from the system' },
  { name: 'MANAGE_PROJECT_MEMBERS', description: 'Manage project team members' },
  
  // Enhanced Task Management
  { name: 'MANAGE_TASK_CHECKLISTS', description: 'Manage task checklists and sub-items' },
  { name: 'MANAGE_TASK_ATTACHMENTS', description: 'Manage task file attachments' },
  { name: 'MANAGE_TASK_COMMENTS', description: 'Manage task comments and discussions' },
  { name: 'MANAGE_TASK_TIME_ENTRIES', description: 'Manage task time tracking entries' },
  { name: 'CREATE_SUBTASKS', description: 'Create subtasks under parent tasks' },
  
  // Deal Management
  { name: 'CREATE_DEAL', description: 'Create new deals' },
  { name: 'READ_DEAL', description: 'View deal information' },
  { name: 'UPDATE_DEAL', description: 'Update deal information' },
  { name: 'DELETE_DEAL', description: 'Delete deals from the system' },
  { name: 'MANAGE_DEAL_ACTIVITIES', description: 'Manage deal activities and communications' },
  
  // Client Management
  { name: 'CREATE_CLIENT', description: 'Create new clients' },
  { name: 'READ_CLIENT', description: 'View client information' },
  { name: 'UPDATE_CLIENT', description: 'Update client information' },
  { name: 'DELETE_CLIENT', description: 'Delete clients from the system' },
  
  // Special Permissions
  { name: 'DELETE_ADMINISTRATOR', description: 'Delete administrator users (restricted)' },
  { name: 'MANAGE_ALL_USERS', description: 'Full access to manage all users' },
  { name: 'SYSTEM_ADMINISTRATION', description: 'Full system administration capabilities' },
]

async function main() {
  console.log('🌱 Seeding roles and permissions...')

  // Create or update all permissions using upsert
  console.log(`📝 Upserting ${PERMISSIONS_DATA.length} permissions...`)
  const permissions = await Promise.all(
    PERMISSIONS_DATA.map((permData) =>
      prisma.permissionModel.upsert({
        where: { name: permData.name as Permission },
        update: { description: permData.description },
        create: {
          name: permData.name as Permission,
          description: permData.description,
        },
      })
    )
  )

  console.log(`✅ Created/Updated ${permissions.length} permissions`)

  // Check if roles already exist
  const existingRoles = await prisma.role.findMany()
  
  if (existingRoles.length > 0) {
    console.log(`ℹ️  Found ${existingRoles.length} existing roles. Skipping role creation.`)
    console.log('   To recreate roles, please delete existing roles first.')
    console.log('🎉 Permissions seeded successfully!')
    return
  }

  // Create roles with permissions
  console.log('👥 Creating default roles...')
  
  const adminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: {
        create: permissions.map(permission => ({
          permissionId: permission.id,
        })),
      },
    },
  })

  const marketingRole = await prisma.role.create({
    data: {
      name: 'Marketing Manager',
      description: 'Manage marketing activities and seeker interactions',
      permissions: {
        create: [
          { permissionId: permissions.find(p => p.name === 'CREATE_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_PROGRAM')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_REPORTS')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'DELETE_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'MANAGE_CAMPAIGN_ANALYTICS')!.id },
        ],
      },
    },
  })

  const coordinatorRole = await prisma.role.create({
    data: {
      name: 'Admissions Coordinator',
      description: 'Coordinate admissions and manage seeker relationships',
      permissions: {
        create: [
          { permissionId: permissions.find(p => p.name === 'READ_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'MANAGE_INQUIRY_INTERACTIONS')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_PROGRAM')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_REPORTS')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_CAMPAIGN')!.id },
        ],
      },
    },
  })

  const managerRole = await prisma.role.create({
    data: {
      name: 'Operations Manager',
      description: 'Manage operations and oversee team activities',
      permissions: {
        create: [
          { permissionId: permissions.find(p => p.name === 'READ_USER')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_PROGRAM')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_PROGRAM')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_REPORTS')!.id },
          { permissionId: permissions.find(p => p.name === 'EXPORT_REPORTS')!.id },
          { permissionId: permissions.find(p => p.name === 'VIEW_ANALYTICS')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'DELETE_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'CREATE_PROJECT')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_PROJECT')!.id },
          { permissionId: permissions.find(p => p.name === 'UPDATE_PROJECT')!.id },
        ],
      },
    },
  })

  const viewerRole = await prisma.role.create({
    data: {
      name: 'Viewer',
      description: 'Read-only access to view information',
      permissions: {
        create: [
          { permissionId: permissions.find(p => p.name === 'READ_SEEKER')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_INQUIRY')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_TASK')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_PROGRAM')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_REPORTS')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_CAMPAIGN')!.id },
          { permissionId: permissions.find(p => p.name === 'READ_PROJECT')!.id },
        ],
      },
    },
  })

  console.log('✅ Created roles with permissions')

  console.log('🎉 Roles and permissions seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding roles and permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
