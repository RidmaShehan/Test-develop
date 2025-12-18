import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding default campaign types...')

  const defaultCampaignTypes = [
    // Social Media Types
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
      name: 'TIKTOK',
      description: 'TikTok advertising campaigns',
      color: '#000000',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'YOUTUBE',
      description: 'YouTube advertising campaigns',
      color: '#FF0000',
      isDefault: true,
      isActive: true,
    },
    // Traditional Media Types
    {
      name: 'NEWSPAPER',
      description: 'Newspaper advertising campaigns',
      color: '#6B7280',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'TV_ADS',
      description: 'Television advertising campaigns',
      color: '#8B5CF6',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'RADIO',
      description: 'Radio advertising campaigns',
      color: '#F59E0B',
      isDefault: true,
      isActive: true,
    },
    // Digital Marketing Types
    {
      name: 'WEB_ADS',
      description: 'Web advertising campaigns',
      color: '#10B981',
      isDefault: true,
      isActive: true,
    },
    // Events & Referrals
    {
      name: 'EXHIBITION',
      description: 'Exhibition and trade show participation',
      color: '#F97316',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'FRIEND_SAID',
      description: 'Referrals from friends and acquaintances',
      color: '#84CC16',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'RECOMMENDED',
      description: 'Recommended by others',
      color: '#06B6D4',
      isDefault: true,
      isActive: true,
    },
  ]

  for (const campaignType of defaultCampaignTypes) {
    try {
      await prisma.campaignType.upsert({
        where: { name: campaignType.name },
        update: campaignType,
        create: campaignType,
      })
      console.log(`✅ Created/Updated campaign type: ${campaignType.name}`)
    } catch (error) {
      console.error(`❌ Error creating campaign type ${campaignType.name}:`, error)
    }
  }

  console.log('🎉 Campaign types seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding campaign types:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
