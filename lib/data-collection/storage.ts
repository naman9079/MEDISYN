import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import type { CollectionRun, SourceResult } from "@/lib/data-collection/types"
import { persistCollectionRunToDb } from "@/lib/data-collection/db"

const RAW_DIR = path.join(process.cwd(), "data", "raw")

type PersistDbResult = {
  dbPath: string
  insertedItems: number
  error?: string
}

function buildCollectionRun(results: SourceResult[]): CollectionRun {
  const items = results.flatMap((result) => result.items)
  const successfulSources = results.filter((result) => !result.error).length
  const failedSources = results.filter((result) => Boolean(result.error)).length

  return {
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    sourceCount: results.length,
    successfulSources,
    failedSources,
    sources: results.map((result) => ({
      id: result.source.id,
      name: result.source.name,
      type: result.source.type,
      itemCount: result.items.length,
      error: result.error,
    })),
    items,
  }
}

export async function persistCollectionRun(results: SourceResult[]) {
  const run = buildCollectionRun(results)

  await mkdir(RAW_DIR, { recursive: true })

  const stamp = run.generatedAt.replace(/[:.]/g, "-")
  const runFile = path.join(RAW_DIR, `treatment-discussions-${stamp}.json`)
  const latestFile = path.join(RAW_DIR, "latest.json")

  const payload = JSON.stringify(run, null, 2)

  await writeFile(runFile, payload, "utf8")
  await writeFile(latestFile, payload, "utf8")

  let dbResult: PersistDbResult

  try {
    dbResult = await persistCollectionRunToDb(run, {
      runFile,
      latestFile,
    })
  } catch (error) {
    dbResult = {
      dbPath: "postgres",
      insertedItems: 0,
      error: error instanceof Error ? error.message : "Database persistence failed",
    }
  }

  return {
    run,
    runFile,
    latestFile,
    dbResult,
  }
}
