/**
 * Run Prisma migrations during Vercel builds (safe defaults).
 *
 * - Production: runs `prisma migrate deploy` if DATABASE_URL is present
 * - Preview/Dev: skips by default (set RUN_MIGRATIONS=1 to force)
 *
 * Notes:
 * - Vercel Postgres often provides pooled + non-pooled URLs. If DIRECT_URL (or
 *   POSTGRES_URL_NON_POOLING) is provided, we use it for migrations to avoid
 *   PgBouncer/pooled limitations.
 */
const { spawnSync } = require('node:child_process')
const path = require('node:path')

function shouldRunMigrations() {
  if (process.env.RUN_MIGRATIONS === '1' || process.env.RUN_MIGRATIONS === 'true') return true
  return process.env.VERCEL_ENV === 'production'
}

function pickDatabaseUrlForMigrations() {
  return (
    process.env.DIRECT_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL
  )
}

function main() {
  if (!shouldRunMigrations()) {
    console.log('[migrate] Skipping Prisma migrations (not production). Set RUN_MIGRATIONS=1 to force.')
    return
  }

  const dbUrl = pickDatabaseUrlForMigrations()
  if (!dbUrl) {
    console.log('[migrate] Skipping Prisma migrations (no DATABASE_URL/DIRECT_URL found).')
    return
  }

  const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma')

  console.log('[migrate] Running: prisma migrate deploy')
  const result = spawnSync(prismaBin, ['migrate', 'deploy'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Force migration engine to use a direct/non-pooled URL when available.
      DATABASE_URL: dbUrl,
    },
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

main()


