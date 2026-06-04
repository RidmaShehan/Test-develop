import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { logBackupSchema } from '@/lib/activity-logger'
import {
  getEnumTypes,
  generateIdempotentEnumSql,
  validateCustomTypes,
  getPrimaryKeyInfo,
  sqlType,
  type ColumnRow,
} from '@/lib/backup-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const validation = await validateCustomTypes()
    if (!validation.valid) {
      console.warn('Schema export validation: missing custom types', validation.missingTypes)
    }

    const tables = (await prisma.$queryRawUnsafe<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
       ORDER BY table_name`
    )).map(r => r.table_name)

    const lines: string[] = [
      '-- Database schema export (PostgreSQL)',
      `-- Generated at ${new Date().toISOString()}`,
      '-- Order: TYPES → TABLES (idempotent restore)',
      '-- Table structure only (DDL)',
      ''
    ]
    if (!validation.valid) {
      lines.push(`-- WARNING: Columns reference types not found as ENUMs: ${validation.missingTypes.join(', ')}`)
      lines.push('')
    }

    // 1. ENUM types first (idempotent)
    const enums = await getEnumTypes()
    if (enums.length > 0) {
      lines.push(...generateIdempotentEnumSql(enums))
    }

    // 2. Tables
    for (const table of tables) {
      const cols = await prisma.$queryRawUnsafe<ColumnRow[]>(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        table
      )
      if (cols.length === 0) continue

      const colDefs = cols.map(c => {
        const type = sqlType(c.data_type, c.udt_name, c.character_maximum_length)
        const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL'
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : ''
        return `  "${c.column_name}" ${type}${nullable}${def}`
      })

      const pkInfo = await getPrimaryKeyInfo(table)
      const pkName = pkInfo?.name
      const pkCols = pkInfo?.columns.map(c => `"${c}"`) ?? []

      lines.push(`CREATE TABLE IF NOT EXISTS "public"."${table}" (`)
      lines.push(colDefs.join(',\n'))
      if (pkCols.length) {
        lines.push(`, CONSTRAINT "${pkName}" PRIMARY KEY (${pkCols.join(', ')})`)
      }
      lines.push(');')
      lines.push('')
    }

    const sql = lines.join('\n')
    const filename = `schema-export-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.sql`

    try {
      await logBackupSchema(user.id, request, { tables, filename })
    } catch {
      // Don't fail the download if logging fails
    }

    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Backup schema error:', err)
    return NextResponse.json({ error: 'Failed to generate schema export' }, { status: 500 })
  }
}
