import pg from "pg"
import type { CollectionRun } from "./types"

type DbQueryResult<T> = {
  rows: T[]
}

type DbClient = {
  query<T = Record<string, unknown>>(queryText: string, values?: unknown[]): Promise<DbQueryResult<T>>
  release(): void
}

type DbPool = {
  connect(): Promise<DbClient>
  query<T = Record<string, unknown>>(queryText: string, values?: unknown[]): Promise<DbQueryResult<T>>
}

let pool: DbPool | null = null

function getDatabaseUrl() {
  const value = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL
  if (!value) {
    throw new Error("Missing SUPABASE_DATABASE_URL (or DATABASE_URL). Add it to .env.local.")
  }

  return value
}

function getPool() {
  if (!pool) {
    const databaseUrl = getDatabaseUrl()
    const requiresSsl = /supabase\.co/i.test(databaseUrl)
    const { Pool } = pg as unknown as {
      Pool: new (config: { connectionString?: string; ssl?: { rejectUnauthorized?: boolean } }) => DbPool
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    })
  }

  return pool
}

let schemaReadyPromise: Promise<void> | null = null

type RawDiscussionRow = {
  id: string
  generated_at: string
  source_id: string
  source_type: string
  source_name: string
  title: string
  text: string
  url: string
  author: string | null
  created_at_source: string | null
  collected_at: string
  keywords_json: unknown
  metadata_json: unknown
}

type LatestRunRow = {
  generated_at: string
  total_items: number
  source_count: number
  successful_sources: number
  failed_sources: number
}

type RawCountRow = {
  count: number
}

async function ensureDb() {
  const dbPool = getPool()

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const client = await dbPool.connect()

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS collection_runs (
            generated_at TEXT PRIMARY KEY,
            total_items INTEGER NOT NULL,
            source_count INTEGER NOT NULL,
            successful_sources INTEGER NOT NULL,
            failed_sources INTEGER NOT NULL,
            run_file TEXT,
            latest_file TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS collection_source_stats (
            generated_at TEXT NOT NULL,
            source_id TEXT NOT NULL,
            source_name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            item_count INTEGER NOT NULL,
            error TEXT,
            PRIMARY KEY (generated_at, source_id)
          );

          CREATE TABLE IF NOT EXISTS raw_discussions (
            id TEXT PRIMARY KEY,
            generated_at TEXT NOT NULL,
            source_id TEXT NOT NULL,
            source_type TEXT NOT NULL,
            source_name TEXT NOT NULL,
            title TEXT NOT NULL,
            text TEXT NOT NULL,
            url TEXT NOT NULL,
            author TEXT,
            created_at_source TEXT,
            collected_at TEXT NOT NULL,
            keywords_json JSONB NOT NULL,
            metadata_json JSONB
          );

          CREATE INDEX IF NOT EXISTS idx_raw_discussions_collected_at ON raw_discussions (collected_at DESC);
          CREATE INDEX IF NOT EXISTS idx_raw_discussions_source_type ON raw_discussions (source_type);
        `)
      } finally {
        client.release()
      }
    })()
  }

  await schemaReadyPromise
  return dbPool
}

function describeDatabase() {
  try {
    const host = new URL(getDatabaseUrl()).hostname
    return `postgres://${host}`
  } catch {
    return "postgres"
  }
}

export async function persistCollectionRunToDb(
  run: CollectionRun,
  files: { runFile: string; latestFile: string },
) {
  const db = await ensureDb()
  const client = await db.connect()

  try {
    await client.query("BEGIN")

    await client.query(
      `
        INSERT INTO collection_runs (
          generated_at,
          total_items,
          source_count,
          successful_sources,
          failed_sources,
          run_file,
          latest_file
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (generated_at)
        DO UPDATE SET
          total_items = EXCLUDED.total_items,
          source_count = EXCLUDED.source_count,
          successful_sources = EXCLUDED.successful_sources,
          failed_sources = EXCLUDED.failed_sources,
          run_file = EXCLUDED.run_file,
          latest_file = EXCLUDED.latest_file
      `,
      [
        run.generatedAt,
        run.totalItems,
        run.sourceCount,
        run.successfulSources,
        run.failedSources,
        files.runFile,
        files.latestFile,
      ],
    )

    await client.query("DELETE FROM collection_source_stats WHERE generated_at = $1", [run.generatedAt])
    await client.query("DELETE FROM raw_discussions WHERE generated_at = $1", [run.generatedAt])

    for (const source of run.sources) {
      await client.query(
        `
          INSERT INTO collection_source_stats (
            generated_at,
            source_id,
            source_name,
            source_type,
            item_count,
            error
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (generated_at, source_id)
          DO UPDATE SET
            source_name = EXCLUDED.source_name,
            source_type = EXCLUDED.source_type,
            item_count = EXCLUDED.item_count,
            error = EXCLUDED.error
        `,
        [run.generatedAt, source.id, source.name, source.type, source.itemCount, source.error ?? null],
      )
    }

    for (const item of run.items) {
      await client.query(
        `
          INSERT INTO raw_discussions (
            id,
            generated_at,
            source_id,
            source_type,
            source_name,
            title,
            text,
            url,
            author,
            created_at_source,
            collected_at,
            keywords_json,
            metadata_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb)
          ON CONFLICT (id)
          DO UPDATE SET
            generated_at = EXCLUDED.generated_at,
            source_id = EXCLUDED.source_id,
            source_type = EXCLUDED.source_type,
            source_name = EXCLUDED.source_name,
            title = EXCLUDED.title,
            text = EXCLUDED.text,
            url = EXCLUDED.url,
            author = EXCLUDED.author,
            created_at_source = EXCLUDED.created_at_source,
            collected_at = EXCLUDED.collected_at,
            keywords_json = EXCLUDED.keywords_json,
            metadata_json = EXCLUDED.metadata_json
        `,
        [
          item.id,
          run.generatedAt,
          item.sourceId,
          item.sourceType,
          item.sourceName,
          item.title,
          item.text,
          item.url,
          item.author ?? null,
          item.createdAt ?? null,
          item.collectedAt,
          JSON.stringify(item.keywords ?? []),
          JSON.stringify(item.metadata ?? null),
        ],
      )
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }

  return {
    dbPath: describeDatabase(),
    insertedItems: run.items.length,
  }
}

export async function getRecentRawDiscussions(limit: number, sourceType?: string) {
  const db = await ensureDb()
  const safeLimit = Math.max(1, Math.min(limit, 500))

  const result = sourceType
    ? await db.query<RawDiscussionRow>(
        `
          SELECT id, generated_at, source_id, source_type, source_name, title, text, url, author, created_at_source,
                 collected_at, keywords_json, metadata_json
          FROM raw_discussions
          WHERE source_type = $1
          ORDER BY collected_at DESC
          LIMIT $2
        `,
        [sourceType, safeLimit],
      )
    : await db.query<RawDiscussionRow>(
        `
          SELECT id, generated_at, source_id, source_type, source_name, title, text, url, author, created_at_source,
                 collected_at, keywords_json, metadata_json
          FROM raw_discussions
          ORDER BY collected_at DESC
          LIMIT $1
        `,
        [safeLimit],
      )

  return result.rows.map((row) => ({
    id: String(row.id),
    generatedAt: String(row.generated_at),
    sourceId: String(row.source_id),
    sourceType: String(row.source_type),
    sourceName: String(row.source_name),
    title: String(row.title),
    text: String(row.text),
    url: String(row.url),
    author: row.author ? String(row.author) : undefined,
    createdAt: row.created_at_source ? String(row.created_at_source) : undefined,
    collectedAt: String(row.collected_at),
    keywords: Array.isArray(row.keywords_json) ? (row.keywords_json as string[]) : [],
    metadata: row.metadata_json && typeof row.metadata_json === "object"
      ? (row.metadata_json as Record<string, unknown>)
      : undefined,
  }))
}

export async function getDbHealth() {
  const db = await ensureDb()

  const latestRunResult = await db.query<LatestRunRow>(
    `
      SELECT generated_at, total_items, source_count, successful_sources, failed_sources
      FROM collection_runs
      ORDER BY generated_at DESC
      LIMIT 1
    `,
  )

  const rawCountResult = await db.query<RawCountRow>("SELECT COUNT(*)::int AS count FROM raw_discussions")

  const latestRun = latestRunResult.rows[0]

  return {
    dbPath: describeDatabase(),
    totalRawItems: rawCountResult.rows[0]?.count ?? 0,
    latestRun: latestRun
      ? {
          generatedAt: latestRun.generated_at,
          totalItems: latestRun.total_items,
          sourceCount: latestRun.source_count,
          successfulSources: latestRun.successful_sources,
          failedSources: latestRun.failed_sources,
        }
      : null,
  }
}
