import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding notebook permissions to existing roles...')

  // First, create the notebook permissions if they don't exist
  const notebookPermissions = [
    { name: 'CREATE_NOTEBOOK' as const, description: 'Create new notebooks' },
    { name: 'READ_NOTEBOOK' as const, description: 'View notebooks' },
    { name: 'UPDATE_NOTEBOOK' as const, description: 'Update notebook information' },
    { name: 'DELETE_NOTEBOOK' as const, description: 'Delete notebooks' },
    { name: 'CREATE_NOTE' as const, description: 'Create new notes' },
    { name: 'READ_NOTE' as const, description: 'View notes' },
    { name: 'UPDATE_NOTE' as const, description: 'Update note information' },
    { name: 'DELETE_NOTE' as const, description: 'Delete notes' },
  ]

  const createdPermissions = []
  for (const perm of notebookPermissions) {
    try {
      const permission = await prisma.permissionModel.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      })
      createdPermissions.push(permission)
      console.log(`✅ Permission ${perm.name} created/verified`)
    } catch (error) {
      console.log(`⚠️  Permission ${perm.name} already exists or error occurred`)
    }
  }

  // Update roles with notebook permissions
  const roles = [
    {
      name: 'Super Admin',
      permissions: [
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE'
      ]
    },
    {
      name: 'Marketing Manager',
      permissions: [
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE'
      ]
    },
    {
      name: 'Operations Manager',
      permissions: [
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK', 'DELETE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE', 'DELETE_NOTE'
      ]
    },
    {
      name: 'Admissions Coordinator',
      permissions: [
        'CREATE_NOTEBOOK', 'READ_NOTEBOOK', 'UPDATE_NOTEBOOK',
        'CREATE_NOTE', 'READ_NOTE', 'UPDATE_NOTE'
      ]
    },
    {
      name: 'Viewer',
      permissions: ['READ_NOTEBOOK', 'READ_NOTE']
    }
  ]

  for (const roleData of roles) {
    try {
      const role = await prisma.role.findUnique({
        where: { name: roleData.name },
        include: { permissions: { include: { permission: true } } }
      })

      if (role) {
        const existingPermissionNames = role.permissions.map(rp => rp.permission.name)
        
        for (const permissionName of roleData.permissions) {
          if (!existingPermissionNames.includes(permissionName as any)) {
            const permission = createdPermissions.find(p => p.name === permissionName)
            if (permission) {
              await prisma.rolePermission.create({
                data: {
                  roleId: role.id,
                  permissionId: permission.id
                }
              })
              console.log(`✅ Added ${permissionName} to ${roleData.name}`)
            }
          } else {
            console.log(`⚠️  ${permissionName} already exists in ${roleData.name}`)
          }
        }
      } else {
        console.log(`⚠️  Role ${roleData.name} not found`)
      }
    } catch (error) {
      console.log(`❌ Error updating role ${roleData.name}:`, error)
    }
  }

  console.log('🎉 Notebook permissions added successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error adding notebook permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

