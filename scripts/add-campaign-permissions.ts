import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding campaign permissions to existing roles...')

  // First, create the campaign permissions if they don't exist
  const campaignPermissions = [
    { name: 'CREATE_CAMPAIGN' as const, description: 'Create new marketing campaigns' },
    { name: 'READ_CAMPAIGN' as const, description: 'View campaign information' },
    { name: 'UPDATE_CAMPAIGN' as const, description: 'Update campaign information' },
    { name: 'DELETE_CAMPAIGN' as const, description: 'Delete campaigns from the system' },
  ]

  const createdPermissions = []
  for (const perm of campaignPermissions) {
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

  // Update roles with campaign permissions
  const roles = [
    {
      name: 'Super Admin',
      permissions: ['CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN']
    },
    {
      name: 'Marketing Manager',
      permissions: ['CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN']
    },
    {
      name: 'Operations Manager',
      permissions: ['CREATE_CAMPAIGN', 'READ_CAMPAIGN', 'UPDATE_CAMPAIGN', 'DELETE_CAMPAIGN']
    },
    {
      name: 'Admissions Coordinator',
      permissions: ['READ_CAMPAIGN']
    },
    {
      name: 'Viewer',
      permissions: ['READ_CAMPAIGN']
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

  console.log('🎉 Campaign permissions added successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error adding campaign permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
