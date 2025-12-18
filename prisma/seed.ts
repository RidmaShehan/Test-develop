import { PrismaClient, FollowUpStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create programs
  const programs = await Promise.all([
    prisma.program.create({
      data: {
        name: 'Bachelor of Computer Science',
        level: 'Bachelor',
        campus: 'Main Campus',
        nextIntakeDate: new Date('2024-02-01'),
      },
    }),
    prisma.program.create({
      data: {
        name: 'Master of Business Administration',
        level: 'Master',
        campus: 'Business School',
        nextIntakeDate: new Date('2024-03-01'),
      },
    }),
    prisma.program.create({
      data: {
        name: 'Diploma in Engineering',
        level: 'Diploma',
        campus: 'Engineering Campus',
        nextIntakeDate: new Date('2024-01-15'),
      },
    }),
    prisma.program.create({
      data: {
        name: 'Certificate in Digital Marketing',
        level: 'Certificate',
        campus: 'Online',
        nextIntakeDate: new Date('2024-01-01'),
      },
    }),
  ])

  console.log('✅ Created programs')

  // Create users (mock Clerk IDs)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'user_admin_001',
        name: 'Admin User',
        email: 'admin@educationcrm.com',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_marketing_001',
        name: 'Marketing Manager',
        email: 'marketing@educationcrm.com',
        role: 'ADMINISTRATOR',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_coordinator_001',
        name: 'Admissions Coordinator',
        email: 'coordinator@educationcrm.com',
        role: 'COORDINATOR',
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_marketing_002',
        name: 'Marketing Specialist',
        email: 'marketing2@educationcrm.com',
        role: 'ADMINISTRATOR',
      },
    }),
  ])

  console.log('✅ Created users')

  // Create seekers
  const seekers = await Promise.all([
    prisma.seeker.create({
      data: {
        fullName: 'John Doe',
        phone: '+1234567890',
        email: 'john.doe@email.com',
        city: 'New York',
        ageBand: '18-25',
        programInterestId: programs[0].id,
        marketingSource: 'FB_AD',
        preferredContactTime: '9 AM - 5 PM',
        whatsapp: true,
        consent: true,
        stage: 'CONNECTED',
        createdById: users[1].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'Jane Smith',
        phone: '+1234567891',
        email: 'jane.smith@email.com',
        city: 'Los Angeles',
        ageBand: '26-35',
        programInterestId: programs[1].id,
        marketingSource: 'WEBSITE',
        preferredContactTime: '10 AM - 6 PM',
        whatsapp: false,
        consent: true,
        stage: 'QUALIFIED',
        createdById: users[1].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'Mike Johnson',
        phone: '+1234567892',
        email: 'mike.johnson@email.com',
        city: 'Chicago',
        ageBand: '36-45',
        programInterestId: programs[2].id,
        marketingSource: 'REFERRAL',
        preferredContactTime: '2 PM - 8 PM',
        whatsapp: true,
        consent: true,
        stage: 'COUNSELING_SCHEDULED',
        createdById: users[2].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'Sarah Wilson',
        phone: '+1234567893',
        email: 'sarah.wilson@email.com',
        city: 'Houston',
        ageBand: '18-25',
        programInterestId: programs[3].id,
        marketingSource: 'WALK_IN',
        preferredContactTime: '9 AM - 5 PM',
        whatsapp: true,
        consent: true,
        stage: 'NEW',
        createdById: users[3].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'David Brown',
        phone: '+1234567894',
        email: 'david.brown@email.com',
        city: 'Phoenix',
        ageBand: '26-35',
        programInterestId: programs[0].id,
        marketingSource: 'PHONE',
        preferredContactTime: '1 PM - 7 PM',
        whatsapp: false,
        consent: true,
        stage: 'ATTEMPTING_CONTACT',
        createdById: users[1].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'Emily Davis',
        phone: '+1234567895',
        email: 'emily.davis@email.com',
        city: 'Philadelphia',
        ageBand: '18-25',
        programInterestId: programs[1].id,
        marketingSource: 'FB_AD',
        preferredContactTime: '10 AM - 6 PM',
        whatsapp: true,
        consent: true,
        stage: 'CONSIDERING',
        createdById: users[2].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'Robert Miller',
        phone: '+1234567896',
        email: 'robert.miller@email.com',
        city: 'San Antonio',
        ageBand: '36-45',
        programInterestId: programs[2].id,
        marketingSource: 'WEBSITE',
        preferredContactTime: '9 AM - 5 PM',
        whatsapp: false,
        consent: true,
        stage: 'READY_TO_REGISTER',
        createdById: users[3].id,
      },
    }),
    prisma.seeker.create({
      data: {
        fullName: 'Lisa Garcia',
        phone: '+1234567897',
        email: 'lisa.garcia@email.com',
        city: 'San Diego',
        ageBand: '26-35',
        programInterestId: programs[3].id,
        marketingSource: 'REFERRAL',
        preferredContactTime: '2 PM - 8 PM',
        whatsapp: true,
        consent: true,
        stage: 'LOST',
        createdById: users[1].id,
      },
    }),
  ])

  console.log('✅ Created seekers')

  // Create interactions
  const interactions = await Promise.all([
    prisma.interaction.create({
      data: {
        seekerId: seekers[0].id,
        userId: users[1].id,
        channel: 'CALL',
        outcome: 'CONNECTED_INTERESTED',
        notes: 'Very interested in the program. Asked about admission requirements.',
      },
    }),
    prisma.interaction.create({
      data: {
        seekerId: seekers[1].id,
        userId: users[2].id,
        channel: 'EMAIL',
        outcome: 'APPOINTMENT_BOOKED',
        notes: 'Scheduled campus visit for next week.',
      },
    }),
    prisma.interaction.create({
      data: {
        seekerId: seekers[2].id,
        userId: users[2].id,
        channel: 'WHATSAPP',
        outcome: 'CONNECTED_INTERESTED',
        notes: 'Discussed program details and career prospects.',
      },
    }),
    prisma.interaction.create({
      data: {
        seekerId: seekers[3].id,
        userId: users[3].id,
        channel: 'WALK_IN',
        outcome: 'CONNECTED_INTERESTED',
        notes: 'Walked into campus, very enthusiastic about the program.',
      },
    }),
    prisma.interaction.create({
      data: {
        seekerId: seekers[4].id,
        userId: users[1].id,
        channel: 'CALL',
        outcome: 'NO_ANSWER',
        notes: 'Called during preferred time but no answer.',
      },
    }),
  ])

  console.log('✅ Created interactions')

  // Create follow-up tasks
  const tasks = await Promise.all([
    prisma.followUpTask.create({
      data: {
        seekerId: seekers[0].id,
        assignedTo: users[2].id,
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        purpose: 'SEND_SYLLABUS',
        notes: 'Send detailed syllabus and course structure.',
        status: FollowUpStatus.OPEN,
      },
    }),
    prisma.followUpTask.create({
      data: {
        seekerId: seekers[1].id,
        assignedTo: users[2].id,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        purpose: 'CAMPUS_TOUR',
        notes: 'Prepare for campus tour and answer questions.',
        status: FollowUpStatus.OPEN,
      },
    }),
    prisma.followUpTask.create({
      data: {
        seekerId: seekers[4].id,
        assignedTo: users[1].id,
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        purpose: 'CALLBACK',
        notes: 'Follow up on missed call.',
        status: FollowUpStatus.OPEN,
      },
    }),
    prisma.followUpTask.create({
      data: {
        seekerId: seekers[2].id,
        assignedTo: users[2].id,
        dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        purpose: 'FEE_DISCUSSION',
        notes: 'Discuss fee structure and payment options.',
        status: FollowUpStatus.OVERDUE,
      },
    }),
  ])

  console.log('✅ Created follow-up tasks')

  // Create assignments
  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        seekerId: seekers[0].id,
        coordinatorId: users[2].id,
      },
    }),
    prisma.assignment.create({
      data: {
        seekerId: seekers[1].id,
        coordinatorId: users[2].id,
      },
    }),
    prisma.assignment.create({
      data: {
        seekerId: seekers[2].id,
        coordinatorId: users[2].id,
      },
    }),
  ])

  console.log('✅ Created assignments')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
