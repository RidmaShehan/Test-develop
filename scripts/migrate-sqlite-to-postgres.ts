import { PrismaClient as PostgresPrismaClient, Prisma as PostgresPrisma } from '@prisma/client'

// Generated from `prisma/schema.sqlite.prisma`:
//   npx prisma generate --schema prisma/schema.sqlite.prisma
//
// NOTE: We intentionally use `require()` here (instead of a static `import`) so
// `next build` doesn't fail when the generated SQLite client hasn't been created yet.
// The `npm run db:migrate:data` command generates it before executing this script.
type SqlitePrismaClientCtor = new (...args: any[]) => any
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SqlitePrismaClient = (require('../prisma/generated/sqlite-client') as { PrismaClient: SqlitePrismaClientCtor })
  .PrismaClient

type DmmfModel = {
  name: string
  fields: Array<{
    name: string
    kind: 'scalar' | 'object' | 'enum' | 'unsupported'
    relationName?: string
    relationFromFields?: string[]
    relationToFields?: string[]
    type: string
  }>
}

function delegateName(modelName: string) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

function getDependencyGraph(models: DmmfModel[]) {
  const modelNames = new Set(models.map((m) => m.name))
  const deps = new Map<string, Set<string>>()

  for (const model of models) {
    const d = new Set<string>()
    for (const f of model.fields) {
      if (f.kind !== 'object') continue
      const from = f.relationFromFields ?? []
      // Only treat as a dependency if this model actually stores the FK columns.
      if (from.length === 0) continue
      if (!modelNames.has(f.type)) continue
      if (f.type !== model.name) d.add(f.type)
    }
    deps.set(model.name, d)
  }

  return deps
}

function topoSortModels(models: DmmfModel[]) {
  const deps = getDependencyGraph(models)
  const inDegree = new Map<string, number>()
  const children = new Map<string, Set<string>>()

  for (const m of models) {
    inDegree.set(m.name, 0)
    children.set(m.name, new Set())
  }

  for (const [m, d] of deps.entries()) {
    inDegree.set(m, d.size)
    for (const parent of d) {
      children.get(parent)?.add(m)
    }
  }

  const queue: string[] = []
  for (const [m, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(m)
  }

  const sorted: string[] = []
  while (queue.length) {
    const m = queue.shift()!
    sorted.push(m)
    for (const child of children.get(m) ?? []) {
      inDegree.set(child, (inDegree.get(child) ?? 0) - 1)
      if ((inDegree.get(child) ?? 0) === 0) queue.push(child)
    }
  }

  // If there are cycles (should be rare), fall back to schema order for remaining models.
  if (sorted.length !== models.length) {
    const remaining = models.map((m) => m.name).filter((n) => !sorted.includes(n))
    return [...sorted, ...remaining]
  }

  return sorted
}

function getSelfRelationFkFields(model: DmmfModel) {
  // Identify FK scalar fields that point back to the same model (e.g. Task.parentTaskId, Note.parentNoteId).
  const selfFkFields = new Set<string>()
  for (const f of model.fields) {
    if (f.kind !== 'object') continue
    if (f.type !== model.name) continue
    for (const fromField of f.relationFromFields ?? []) {
      selfFkFields.add(fromField)
    }
  }
  return [...selfFkFields]
}

function topoSortSelfRows<T extends { id: string }>(
  rows: T[],
  parentIdField: string
): { ordered: T[]; hasCycle: boolean } {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const inDegree = new Map<string, number>()
  const children = new Map<string, Set<string>>()

  for (const r of rows) {
    inDegree.set(r.id, 0)
    children.set(r.id, new Set())
  }

  for (const r of rows) {
    const parentId = (r as Record<string, unknown>)[parentIdField] as string | null | undefined
    if (!parentId) continue
    if (!byId.has(parentId)) continue
    inDegree.set(r.id, (inDegree.get(r.id) ?? 0) + 1)
    children.get(parentId)?.add(r.id)
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id)
  }

  const ordered: T[] = []
  while (queue.length) {
    const id = queue.shift()!
    ordered.push(byId.get(id)!)
    for (const childId of children.get(id) ?? []) {
      inDegree.set(childId, (inDegree.get(childId) ?? 0) - 1)
      if ((inDegree.get(childId) ?? 0) === 0) queue.push(childId)
    }
  }

  const hasCycle = ordered.length !== rows.length
  if (hasCycle) {
    // Append remaining rows in their original order; inserts may fail if there is a cycle.
    const seen = new Set(ordered.map((r) => r.id))
    for (const r of rows) if (!seen.has(r.id)) ordered.push(r)
  }

  return { ordered, hasCycle }
}

async function main() {
  const sqliteUrl = process.env.SQLITE_DATABASE_URL ?? 'file:./prisma/dev.db'
  const batchSize = Number(process.env.MIGRATION_BATCH_SIZE ?? '500')

  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL (target Postgres).')
  }

  console.log('🧭 SQLite -> Postgres data migration')
  console.log(`   Source (SQLite): ${sqliteUrl}`)
  console.log('   Target (Postgres): DATABASE_URL from env')
  console.log('')

  const src = new SqlitePrismaClient({
    datasources: { db: { url: sqliteUrl } },
    log: ['error'],
  })

  const dst = new PostgresPrismaClient({
    log: ['error'],
  })

  try {
    await src.$connect()
    await dst.$connect()

    // Basic connectivity check
    await dst.$queryRaw`SELECT 1`

    const models = (PostgresPrisma.dmmf.datamodel.models as unknown as DmmfModel[]).filter(
      (m) => !m.name.startsWith('_')
    )

    const modelByName = new Map(models.map((m) => [m.name, m]))
    const orderedModelNames = topoSortModels(models)

    console.log('📦 Model import order:')
    console.log(`   ${orderedModelNames.join(' -> ')}`)
    console.log('')

    for (const modelName of orderedModelNames) {
      const model = modelByName.get(modelName)
      if (!model) continue

      const delegate = delegateName(modelName)
      const srcDelegate = (src as unknown as Record<string, any>)[delegate]
      const dstDelegate = (dst as unknown as Record<string, any>)[delegate]

      if (!srcDelegate || !dstDelegate) {
        console.log(`⚠️  Skipping ${modelName}: delegate missing (${delegate})`)
        continue
      }

      const total = await srcDelegate.count()
      if (!total) {
        console.log(`✅ ${modelName}: 0 rows (skip)`)
        continue
      }

      const selfFkFields = getSelfRelationFkFields(model)
      if (selfFkFields.length > 1) {
        console.log(
          `⚠️  ${modelName}: multiple self-FK fields (${selfFkFields.join(', ')}). ` +
            `This script will not attempt to order them; you may need manual handling.`
        )
      }

      console.log(`➡️  ${modelName}: migrating ${total} rows...`)

      // Special handling for self-referential FK graphs (Task.parentTaskId, Note.parentNoteId)
      if (selfFkFields.length === 1) {
        const parentIdField = selfFkFields[0]
        const rows: Array<{ id: string } & Record<string, any>> = await srcDelegate.findMany()
        const { ordered, hasCycle } = topoSortSelfRows(rows, parentIdField)
        if (hasCycle) {
          console.log(`   ⚠️  ${modelName}: cycle detected in ${parentIdField}; some inserts may fail.`)
        }

        for (let i = 0; i < ordered.length; i += batchSize) {
          const chunk = ordered.slice(i, i + batchSize)
          await dstDelegate.createMany({ data: chunk, skipDuplicates: true })
          process.stdout.write(`   - inserted ${Math.min(i + chunk.length, ordered.length)}/${ordered.length}\r`)
        }
        process.stdout.write('\n')
        console.log(`✅ ${modelName}: done`)
        continue
      }

      // Standard path: paginate by `id`
      let processed = 0
      let cursorId: string | null = null

      while (processed < total) {
        const rows: Array<{ id: string } & Record<string, any>> = await srcDelegate.findMany({
          take: batchSize,
          ...(cursorId
            ? {
                skip: 1,
                cursor: { id: cursorId },
              }
            : {}),
          orderBy: { id: 'asc' },
        })

        if (!rows.length) break

        await dstDelegate.createMany({ data: rows, skipDuplicates: true })

        processed += rows.length
        cursorId = rows[rows.length - 1].id
        process.stdout.write(`   - inserted ${processed}/${total}\r`)
      }
      process.stdout.write('\n')
      console.log(`✅ ${modelName}: done`)
    }

    console.log('\n🎉 Migration complete.')
    console.log('Next: run `npm run db:verify` and spot-check key relations.')
  } finally {
    await Promise.allSettled([src.$disconnect(), dst.$disconnect()])
  }
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err)
  process.exit(1)
})


