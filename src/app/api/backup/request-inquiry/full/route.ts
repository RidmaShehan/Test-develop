import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { requestInquiryPrisma } from '@/lib/request-inquiry-prisma'

type SequenceInfo = {
  schemaname: string
  sequencename: string
  tablename: string | null
  columnname: string | null
}

type ColumnRow = {
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

async function getSequences(): Promise<SequenceInfo[]> {
  const rows = await requestInquiryPrisma.$queryRawUnsafe(
    `
    SELECT
      n.nspname        AS schemaname,
      c.relname        AS sequencename,
      t.relname        AS tablename,
      a.attname        AS columnname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_depend d ON d.objid = c.oid AND d.deptype = 'a'
    LEFT JOIN pg_class t ON t.oid = d.refobjid
    LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
    WHERE c.relkind = 'S'
      AND n.nspname = 'public'
    ORDER BY n.nspname, c.relname;
    `
  ) as SequenceInfo[]
  return rows
}

function generateSequenceCreateSql(sequences: SequenceInfo[]): string[] {
  const lines: string[] = ['-- Sequences', '']
  for (const s of sequences) {
    const seqName = `"${s.schemaname}"."${s.sequencename}"`
    lines.push(`CREATE SEQUENCE IF NOT EXISTS ${seqName};`)
  }
  lines.push('')
  return lines
}

function generateSequenceOwnedBySql(sequences: SequenceInfo[]): string[] {
  const lines: string[] = ['-- Sequence ownership', '']
  for (const s of sequences) {
    if (!s.tablename || !s.columnname) continue
    const seqName = `"${s.schemaname}"."${s.sequencename}"`
    lines.push(
      `ALTER SEQUENCE ${seqName} OWNED BY "${s.schemaname}"."${s.tablename}"."${s.columnname}";`
    )
  }
  lines.push('')
  return lines
}

function sqlType(
  dataType: string,
  udtName: string,
  charMaxLength: number | null
): string {
  const t = (udtName || dataType).toLowerCase()
  if (t === 'varchar' || t === 'char' || dataType === 'character varying') {
    return charMaxLength != null ? `character varying(${charMaxLength})` : 'character varying'
  }
  if (t === 'bpchar') return charMaxLength != null ? `char(${charMaxLength})` : 'char(1)'
  if (t === 'int4') return 'integer'
  if (t === 'int8') return 'bigint'
  if (t === 'int2') return 'smallint'
  if (t === 'float4') return 'real'
  if (t === 'float8') return 'double precision'
  if (t === 'bool') return 'boolean'
  if (t === 'timestamptz') return 'timestamp with time zone'
  if (t === 'timestamp') return 'timestamp without time zone'
  if (t === 'date') return 'date'
  if (t === 'jsonb') return 'jsonb'
  if (t === 'json') return 'json'
  if (t === 'text') return 'text'
  return udtName || dataType
}

function escapeString(s: string): string {
  return s.replace(/'/g, "''")
}

/** Format value for PostgreSQL TIME column: time-only string, not full timestamp */
function formatTimeOnly(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (val instanceof Date) return `'${val.toISOString().slice(11, 23)}'`
  if (typeof val === 'string') {
    const match = val.match(/T(\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?)/)
    if (match) return `'${match[1]}'`
    if (/^\d{2}:\d{2}/.test(val)) return `'${escapeString(val)}'`
  }
  return `'${escapeString(String(val))}'`
}

function escapeSqlLiteral(val: unknown, dataType?: string, udtName?: string): string {
  if (val === null || val === undefined) return 'NULL'
  const dt = (dataType || '').toLowerCase()
  const ut = (udtName || '').toLowerCase()
  if (dt === 'time without time zone' || dt === 'time with time zone' || ut === 'time' || ut === 'timetz') {
    return formatTimeOnly(val)
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number' && !Number.isNaN(val)) return String(val)
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (typeof val === 'object') return `'${escapeString(JSON.stringify(val))}'`
  return `'${escapeString(String(val))}'`
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!isAdminRole(user.role)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
    }

    const tables = (await requestInquiryPrisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
       ORDER BY table_name`
    ) as { table_name: string }[]).map((r: { table_name: string }) => r.table_name)

    const sequences = await getSequences()

    const lines: string[] = [
      '-- Request Inquiry DB backup (schema + data)',
      `-- Generated at ${new Date().toISOString()}`,
      '-- Order: SEQUENCES → TABLES → SEQUENCE OWNERSHIP → DATA (no custom ENUM types in this schema).',
      '-- PostgreSQL',
      ''
    ]

    if (sequences.length > 0) {
      lines.push(...generateSequenceCreateSql(sequences))
    }

    for (const table of tables) {
      const cols = await requestInquiryPrisma.$queryRawUnsafe(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        table
      ) as ColumnRow[]
      if (cols.length === 0) continue

      const colDefs = cols.map(c => {
        const type = sqlType(c.data_type, c.udt_name, c.character_maximum_length)
        const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL'
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : ''
        return `  "${c.column_name}" ${type}${nullable}${def}`
      })

      const pkRows = await requestInquiryPrisma.$queryRawUnsafe(
        `SELECT c.constraint_name
         FROM information_schema.table_constraints c
         WHERE c.table_schema = 'public'
           AND c.table_name = $1
           AND c.constraint_type = 'PRIMARY KEY'`,
        table
      ) as { constraint_name: string }[]
      const pkName = pkRows[0]?.constraint_name
      const pkCols: string[] = []
      if (pkName) {
        const colRows = await requestInquiryPrisma.$queryRawUnsafe(
          `SELECT column_name
           FROM information_schema.key_column_usage
           WHERE constraint_name = $1
             AND table_schema = 'public'
             AND table_name = $2
           ORDER BY ordinal_position`,
          pkName,
          table
        ) as { column_name: string }[]
        const seen = new Set<string>()
        for (const r of colRows) {
          if (!seen.has(r.column_name)) {
            seen.add(r.column_name)
            pkCols.push(`"${r.column_name}"`)
          }
        }
      }

      lines.push(`-- Table: ${table}`)
      lines.push(`CREATE TABLE IF NOT EXISTS "public"."${table}" (`)
      lines.push(colDefs.join(',\n'))
      if (pkCols.length) {
        lines.push(`, CONSTRAINT "${pkName}" PRIMARY KEY (${pkCols.join(', ')})`)
      }
      lines.push(');')
      lines.push('')

      const columnNames = cols.map(c => c.column_name)
      const quotedCols = columnNames.map(c => `"${c}"`).join(', ')
      const rows = await requestInquiryPrisma.$queryRawUnsafe(
        `SELECT * FROM "public"."${table}"`
      ) as Record<string, unknown>[]

      if (rows.length > 0) {
        lines.push(`-- Data: ${table} (${rows.length} rows)`)
        const batchSize = 50
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const values = batch.map(row => {
            const vals = cols.map(c => escapeSqlLiteral(row[c.column_name], c.data_type, c.udt_name))
            return `(${vals.join(', ')})`
          })
          lines.push(`INSERT INTO "public"."${table}" (${quotedCols}) VALUES`)
          lines.push(values.join(',\n'))
          lines.push(';')
          lines.push('')
        }
      }
    }

    // After all tables exist, safely attach sequences to columns
    if (sequences.length > 0) {
      lines.push(...generateSequenceOwnedBySql(sequences))
    }

    const sql = lines.join('\n')
    const filename = `request-inquiry-backup-full-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.sql`

    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Request Inquiry full backup error:', err)
    return NextResponse.json({ error: 'Failed to generate Request Inquiry full backup' }, { status: 500 })
  }
}

