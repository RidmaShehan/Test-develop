import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up campaign types - keeping only main social media types...')

  // Define the main campaign types we want to keep
  const mainCampaignTypes = [
    {
      name: 'FACEBOOK',
      description: 'Facebook advertising campaigns',
      color: '#1877F2',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'INSTAGRAM', 
      description: 'Instagram advertising campaigns',
      color: '#E4405F',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'LIKE',
      description: 'Social media like campaigns',
      color: '#EF4444',
      isDefault: true,
      isActive: true,
    }
  ]

  try {
    // First, create the main campaign types
    console.log('✨ Creating main campaign types...')
    for (const campaignType of mainCampaignTypes) {
      await prisma.campaignType.upsert({
        where: { name: campaignType.name },
        update: campaignType,
        create: campaignType
      })
      console.log(`✅ Created/Updated campaign type: ${campaignType.name}`)
    }

    // Now update any existing campaigns to use the new types
    console.log('🔄 Updating existing campaigns...')
    const campaigns = await prisma.campaign.findMany()
    
    for (const campaign of campaigns) {
      // Map old types to new types
      let newType = campaign.type
      
      if (campaign.type === 'EMAIL' || campaign.type === 'SMS' || campaign.type === 'CALL_CAMPAIGN') {
        newType = 'LIKE'
      } else if (campaign.type === 'FACEBOOK' || campaign.type === 'FB') {
        newType = 'FACEBOOK'
      } else if (campaign.type === 'INSTAGRAM' || campaign.type === 'IG') {
        newType = 'INSTAGRAM'
      } else {
        // Default to LIKE for any other types
        newType = 'LIKE'
      }

      if (newType !== campaign.type) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { type: newType }
        })
        console.log(`🔄 Updated campaign "${campaign.name}" from ${campaign.type} to ${newType}`)
      }
    }

    // Now delete any campaign types that are not in our main list
    console.log('🗑️  Deleting unused campaign types...')
    const existingTypes = await prisma.campaignType.findMany()
    const mainTypeNames = mainCampaignTypes.map(t => t.name)
    
    for (const type of existingTypes) {
      if (!mainTypeNames.includes(type.name)) {
        await prisma.campaignType.delete({
          where: { id: type.id }
        })
        console.log(`🗑️  Deleted unused campaign type: ${type.name}`)
      }
    }

    console.log('🎉 Campaign types cleanup completed!')
    console.log('📋 Main campaign types:')
    mainCampaignTypes.forEach(type => {
      console.log(`   - ${type.name}: ${type.description}`)
    })

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
