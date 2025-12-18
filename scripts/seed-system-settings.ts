import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSystemSettings() {
  console.log('🔧 Seeding system settings...')

  try {
    // Activity Logging Settings
    await prisma.systemSettings.upsert({
      where: { key: 'USER_ACTIVITY_LOGGING_ENABLED' },
      update: {},
      create: {
        key: 'USER_ACTIVITY_LOGGING_ENABLED',
        value: 'true',
        description: 'Enable/disable user activity logging (login, logout, system access)',
        isActive: true,
        requiresRestart: false
      }
    })

    // Session Timeout Settings
    await prisma.systemSettings.upsert({
      where: { key: 'SESSION_TIMEOUT_MINUTES' },
      update: {},
      create: {
        key: 'SESSION_TIMEOUT_MINUTES',
        value: '480', // 8 hours
        description: 'Session timeout in minutes (default: 8 hours)',
        isActive: true,
        requiresRestart: false
      }
    })

    // Login Attempts Settings
    await prisma.systemSettings.upsert({
      where: { key: 'MAX_LOGIN_ATTEMPTS' },
      update: {},
      create: {
        key: 'MAX_LOGIN_ATTEMPTS',
        value: '5',
        description: 'Maximum failed login attempts before account lockout',
        isActive: true,
        requiresRestart: false
      }
    })

    // Account Lockout Duration
    await prisma.systemSettings.upsert({
      where: { key: 'ACCOUNT_LOCKOUT_MINUTES' },
      update: {},
      create: {
        key: 'ACCOUNT_LOCKOUT_MINUTES',
        value: '30',
        description: 'Account lockout duration in minutes after max failed attempts',
        isActive: true,
        requiresRestart: false
      }
    })

    // Password Requirements
    await prisma.systemSettings.upsert({
      where: { key: 'PASSWORD_MIN_LENGTH' },
      update: {},
      create: {
        key: 'PASSWORD_MIN_LENGTH',
        value: '8',
        description: 'Minimum password length',
        isActive: true,
        requiresRestart: false
      }
    })

    // System Maintenance Mode
    await prisma.systemSettings.upsert({
      where: { key: 'MAINTENANCE_MODE' },
      update: {},
      create: {
        key: 'MAINTENANCE_MODE',
        value: 'false',
        description: 'Enable/disable maintenance mode',
        isActive: true,
        requiresRestart: true
      }
    })

    // Email Notifications
    await prisma.systemSettings.upsert({
      where: { key: 'EMAIL_NOTIFICATIONS_ENABLED' },
      update: {},
      create: {
        key: 'EMAIL_NOTIFICATIONS_ENABLED',
        value: 'true',
        description: 'Enable/disable email notifications',
        isActive: true,
        requiresRestart: false
      }
    })

    // Data Retention
    await prisma.systemSettings.upsert({
      where: { key: 'ACTIVITY_LOG_RETENTION_DAYS' },
      update: {},
      create: {
        key: 'ACTIVITY_LOG_RETENTION_DAYS',
        value: '365',
        description: 'Number of days to retain activity logs (0 = forever)',
        isActive: true,
        requiresRestart: false
      }
    })

    console.log('✅ System settings seeded successfully')
  } catch (error) {
    console.error('❌ Error seeding system settings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSystemSettings()
