import path from "node:path"
import { readFile } from "node:fs/promises"
import { NextRequest, NextResponse } from "next/server"
import { collectAllSources } from "@/lib/data-collection/collectors"
import { persistCollectionRun } from "@/lib/data-collection/storage"
import type { SourceConfig } from "@/lib/data-collection/types"
import { medisynConditions } from "@/lib/conditions"

export const runtime = "nodejs"

const defaultSources: SourceConfig[] = [
  {
    id: "your-reddit-source",
    type: "reddit",
    name: "Your Reddit Source",
    enabled: false,
    subreddit: "",
    query: "",
    sort: "new",
    limit: 25,
    keywords: [],
  },
]

async function loadSourcesFromFile() {
  const sourceFile = path.join(process.cwd(), "data", "real", "collection-sources.json")

  try {
    const content = await readFile(sourceFile, "utf8")
    const parsed = JSON.parse(content) as unknown

    if (!Array.isArray(parsed)) {
      return defaultSources
    }

    const sources = parsed.filter((entry): entry is SourceConfig => {
      if (typeof entry !== "object" || entry === null) {
        return false
      }

      const candidate = entry as Record<string, unknown>
      return typeof candidate.id === "string" && typeof candidate.type === "string" && typeof candidate.name === "string"
    })

    return sources.length > 0 ? sources : defaultSources
  } catch {
    return defaultSources
  }
}

function buildDiseaseRedditSources(): SourceConfig[] {
  const subreddit = "AskDocs"

  return medisynConditions.map((condition) => {
    const aliases = Array.from(new Set([condition.name, ...condition.aliases]))
    const aliasQuery = aliases
      .slice(0, 6)
      .map((alias) => (alias.includes(" ") ? `"${alias}"` : alias))
      .join(" OR ")

    return {
      id: `reddit-${condition.id}`,
      type: "reddit" as const,
      name: `${condition.name} Patient Experiences (Reddit)`,
      enabled: true,
      subreddit,
      query: `(${aliasQuery}) (experience OR treatment OR medication OR recovery OR side effects)`,
      sort: "new" as const,
      limit: 20,
      keywords: aliases,
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { sources?: SourceConfig[]; preset?: "reddit-only" }
      | null
    const baseSources = body?.sources && Array.isArray(body.sources) && body.sources.length > 0
      ? body.sources
      : await loadSourcesFromFile()
    const sources = body?.preset === "reddit-only"
      ? (() => {
          const redditSources = baseSources.filter((source) => source.type === "reddit")
          const enabledRedditSources = redditSources.filter((source) => source.enabled)

          if (enabledRedditSources.length > 0) {
            return redditSources
          }

          return buildDiseaseRedditSources()
        })()
      : baseSources
    const enabledSources = sources.filter((source) => source.enabled)

    if (enabledSources.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No enabled sources available. Add your own source in data/real/collection-sources.json.",
        },
        { status: 400 },
      )
    }

    const results = await collectAllSources(enabledSources)
    const persisted = await persistCollectionRun(results)

    return NextResponse.json({
      ok: true,
      generatedAt: persisted.run.generatedAt,
      summary: {
        sourceCount: persisted.run.sourceCount,
        successfulSources: persisted.run.successfulSources,
        failedSources: persisted.run.failedSources,
        totalItems: persisted.run.totalItems,
      },
      sources: persisted.run.sources,
      files: {
        runFile: path.relative(process.cwd(), persisted.runFile),
        latestFile: path.relative(process.cwd(), persisted.latestFile),
      },
      database: {
        dbPath: persisted.dbResult.dbPath,
        insertedItems: persisted.dbResult.insertedItems,
        error: persisted.dbResult.error ?? null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Data collection failed",
      },
      { status: 500 },
    )
  }
}
