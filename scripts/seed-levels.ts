import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding levels...')

  // Create levels
  const levels = await Promise.all([
    prisma.level.create({
      data: {
        name: 'Certificate',
        description: 'Short-term certificate programs',
        isVisible: true,
        sortOrder: 1,
      },
    }),
    prisma.level.create({
      data: {
        name: 'Diploma',
        description: 'Diploma level programs',
        isVisible: true,
        sortOrder: 2,
      },
    }),
    prisma.level.create({
      data: {
        name: 'Bachelor',
        description: 'Bachelor degree programs',
        isVisible: true,
        sortOrder: 3,
      },
    }),
    prisma.level.create({
      data: {
        name: 'Master',
        description: 'Master degree programs',
        isVisible: true,
        sortOrder: 4,
      },
    }),
    prisma.level.create({
      data: {
        name: 'PhD',
        description: 'Doctoral programs',
        isVisible: true,
        sortOrder: 5,
      },
    }),
  ])

  console.log('✅ Created levels')

  // Update existing programs to use the new level system
  const programs = await prisma.program.findMany()
  
  for (const program of programs) {
    const level = levels.find(l => l.name === program.level)
    if (level) {
      await prisma.program.update({
        where: { id: program.id },
        data: { levelId: level.id },
      })
    }
  }

  console.log('✅ Updated existing programs with level references')

  console.log('🎉 Levels seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding levels:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
