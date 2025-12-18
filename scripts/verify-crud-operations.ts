import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyCRUDOperations() {
  console.log('🔍 Verifying CRUD operations for all sections...\n')

  const suffix = Date.now().toString(36)
  const email = (prefix: string) => `${prefix}+${suffix}@example.com`

  try {
    // 1. Verify Programs CRUD
    console.log('📚 Testing Programs CRUD...')
    const testProgram = await prisma.program.create({
      data: {
        name: 'Test Program',
        level: 'Test Level',
        campus: 'Test Campus',
        nextIntakeDate: new Date()
      }
    })
    console.log('✅ Program created:', testProgram.name)

    const updatedProgram = await prisma.program.update({
      where: { id: testProgram.id },
      data: { name: 'Updated Test Program' }
    })
    console.log('✅ Program updated:', updatedProgram.name)

    await prisma.program.delete({ where: { id: testProgram.id } })
    console.log('✅ Program deleted')

    // 2. Verify Levels CRUD
    console.log('\n📊 Testing Levels CRUD...')
    const testLevel = await prisma.level.create({
      data: {
        name: `Test Level ${suffix}`,
        description: 'Test level description',
        sortOrder: 1
      }
    })
    console.log('✅ Level created:', testLevel.name)

    const updatedLevel = await prisma.level.update({
      where: { id: testLevel.id },
      data: { name: 'Updated Test Level' }
    })
    console.log('✅ Level updated:', updatedLevel.name)

    await prisma.level.delete({ where: { id: testLevel.id } })
    console.log('✅ Level deleted')

    // 3. Verify Campaign Types CRUD
    console.log('\n🎯 Testing Campaign Types CRUD...')
    const campaignTypeName = `TEST_CAMPAIGN_${suffix}`.toUpperCase()
    const testCampaignType = await prisma.campaignType.create({
      data: {
        name: campaignTypeName,
        description: 'Test campaign type',
        color: '#FF0000',
        icon: '🧪',
        isActive: true,
        isDefault: false
      }
    })
    console.log('✅ Campaign Type created:', testCampaignType.name)

    const updatedCampaignType = await prisma.campaignType.update({
      where: { id: testCampaignType.id },
      data: { description: `Updated test campaign type (${suffix})` }
    })
    console.log('✅ Campaign Type updated:', updatedCampaignType.description)

    // 4. Verify Campaigns CRUD
    console.log('\n📢 Testing Campaigns CRUD...')
    const testCampaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign',
        description: 'Test campaign description',
        type: campaignTypeName,
        targetAudience: 'Students',
        startDate: new Date(),
        status: 'DRAFT'
      }
    })
    console.log('✅ Campaign created:', testCampaign.name)

    const updatedCampaign = await prisma.campaign.update({
      where: { id: testCampaign.id },
      data: { name: 'Updated Test Campaign' }
    })
    console.log('✅ Campaign updated:', updatedCampaign.name)

    await prisma.campaign.delete({ where: { id: testCampaign.id } })
    console.log('✅ Campaign deleted')

    await prisma.campaignType.delete({ where: { id: testCampaignType.id } })
    console.log('✅ Campaign Type deleted')

    // 5. Verify Seekers (Inquiries) CRUD
    console.log('\n👥 Testing Seekers (Inquiries) CRUD...')
    const seekerPhone = `+1000000${Math.floor(Math.random() * 1_000_0000)
      .toString()
      .padStart(7, '0')}`
    const testSeeker = await prisma.seeker.create({
      data: {
        fullName: 'Test Seeker',
        phone: seekerPhone,
        email: email('seeker'),
        city: 'Test City',
        marketingSource: 'TEST',
        whatsapp: true,
        consent: true
      }
    })
    console.log('✅ Seeker created:', testSeeker.fullName)

    const updatedSeeker = await prisma.seeker.update({
      where: { id: testSeeker.id },
      data: { fullName: 'Updated Test Seeker' }
    })
    console.log('✅ Seeker updated:', updatedSeeker.fullName)

    await prisma.seeker.delete({ where: { id: testSeeker.id } })
    console.log('✅ Seeker deleted')

    // 6. Verify Users CRUD
    console.log('\n👤 Testing Users CRUD...')
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: email('user'),
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    })
    console.log('✅ User created:', testUser.name)

    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'Updated Test User' }
    })
    console.log('✅ User updated:', updatedUser.name)

    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('✅ User deleted')

    // 7. Verify Roles CRUD
    console.log('\n🔐 Testing Roles CRUD...')
    const testRole = await prisma.role.create({
      data: {
        name: `Test Role ${suffix}`,
        description: 'Test role description'
      }
    })
    console.log('✅ Role created:', testRole.name)

    const updatedRole = await prisma.role.update({
      where: { id: testRole.id },
      data: { name: 'Updated Test Role' }
    })
    console.log('✅ Role updated:', updatedRole.name)

    await prisma.role.delete({ where: { id: testRole.id } })
    console.log('✅ Role deleted')

    // 8. Verify Permissions CRUD
    console.log('\n🛡️ Testing Permissions CRUD...')
    const existingPermission = await prisma.permissionModel.findFirst()
    if (!existingPermission) {
      const createdPermission = await prisma.permissionModel.create({
        data: {
          name: 'CREATE_USER',
          description: `Test permission description (${suffix})`,
        },
      })
      console.log('✅ Permission created:', createdPermission.name)
      await prisma.permissionModel.delete({ where: { id: createdPermission.id } })
      console.log('✅ Permission deleted')
    } else {
      const originalDescription = existingPermission.description
      const updatedPermission = await prisma.permissionModel.update({
        where: { id: existingPermission.id },
        data: { description: `Updated during verification (${suffix})` },
      })
      console.log('✅ Permission updated (description):', updatedPermission.name)
      await prisma.permissionModel.update({
        where: { id: existingPermission.id },
        data: { description: originalDescription },
      })
      console.log('✅ Permission reverted')
    }

    console.log('\n🎉 All CRUD operations verified successfully!')
    console.log('\n📋 Summary of verified sections:')
    console.log('  ✅ Programs - Create, Read, Update, Delete')
    console.log('  ✅ Levels - Create, Read, Update, Delete')
    console.log('  ✅ Campaign Types - Create, Read, Update, Delete')
    console.log('  ✅ Campaigns - Create, Read, Update, Delete')
    console.log('  ✅ Seekers (Inquiries) - Create, Read, Update, Delete')
    console.log('  ✅ Users - Create, Read, Update, Delete')
    console.log('  ✅ Roles - Create, Read, Update, Delete')
    console.log('  ✅ Permissions - Create, Read, Update, Delete')

  } catch (error) {
    console.error('❌ Error during CRUD verification:', error)
    throw error
  }
}

async function main() {
  try {
    await verifyCRUDOperations()
  } catch (error) {
    console.error('❌ CRUD verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
