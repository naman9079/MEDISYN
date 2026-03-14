import { randomUUID } from "node:crypto"
import type {
  RawDiscussion,
  RedditSourceConfig,
  RssSourceConfig,
  SourceConfig,
  SourceResult,
  WebPageSourceConfig,
} from "@/lib/data-collection/types"

const REQUEST_TIMEOUT_MS = 20000

function sanitizeText(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "medisyn-data-collector/1.0",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`)
    }

    return response
  } finally {
    clearTimeout(timeout)
  }
}

async function collectReddit(source: RedditSourceConfig): Promise<RawDiscussion[]> {
  const limit = Math.max(1, Math.min(source.limit ?? 25, 100))
  const sort = source.sort ?? "new"
  const query = encodeURIComponent(source.query)
  const url = `https://www.reddit.com/r/${encodeURIComponent(source.subreddit)}/search.json?q=${query}&restrict_sr=1&sort=${sort}&limit=${limit}`
  const response = await fetchWithTimeout(url)
  const payload = (await response.json()) as {
    data?: { children?: Array<{ data?: Record<string, unknown> }> }
  }

  const rows = payload.data?.children ?? []
  const collectedAt = new Date().toISOString()

  return rows
    .map((row) => row.data)
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map((row) => {
      const title = typeof row.title === "string" ? row.title : "Untitled Reddit Post"
      const body = typeof row.selftext === "string" ? row.selftext : ""
      const permalink = typeof row.permalink === "string" ? row.permalink : ""
      const createdUtc = typeof row.created_utc === "number" ? row.created_utc : undefined

      return {
        id: randomUUID(),
        sourceId: source.id,
        sourceType: source.type,
        sourceName: source.name,
        title,
        text: sanitizeText(body || title),
        url: permalink ? `https://www.reddit.com${permalink}` : url,
        author: typeof row.author === "string" ? row.author : undefined,
        createdAt: createdUtc ? new Date(createdUtc * 1000).toISOString() : undefined,
        collectedAt,
        keywords: source.keywords ?? [],
        metadata: {
          subreddit: source.subreddit,
          score: typeof row.score === "number" ? row.score : undefined,
          numComments: typeof row.num_comments === "number" ? row.num_comments : undefined,
        },
      } satisfies RawDiscussion
    })
    .filter((item) => item.text.length > 0)
}

function parseRssItems(xml: string) {
  const itemPattern = /<item\b[\s\S]*?<\/item>/gi
  const titlePattern = /<title\b[^>]*>([\s\S]*?)<\/title>/i
  const descriptionPattern = /<description\b[^>]*>([\s\S]*?)<\/description>/i
  const linkPattern = /<link\b[^>]*>([\s\S]*?)<\/link>/i
  const pubDatePattern = /<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i

  const items = xml.match(itemPattern) ?? []

  return items.map((itemXml) => {
    const title = sanitizeText(itemXml.match(titlePattern)?.[1] ?? "")
    const description = sanitizeText(itemXml.match(descriptionPattern)?.[1] ?? "")
    const link = sanitizeText(itemXml.match(linkPattern)?.[1] ?? "")
    const pubDate = sanitizeText(itemXml.match(pubDatePattern)?.[1] ?? "")

    return { title, description, link, pubDate }
  })
}

async function collectRss(source: RssSourceConfig): Promise<RawDiscussion[]> {
  const response = await fetchWithTimeout(source.feedUrl)
  const xml = await response.text()
  const limit = Math.max(1, Math.min(source.limit ?? 30, 100))
  const parsed = parseRssItems(xml).slice(0, limit)
  const collectedAt = new Date().toISOString()

  return parsed
    .filter((item) => item.title || item.description)
    .map((item) => ({
      id: randomUUID(),
      sourceId: source.id,
      sourceType: source.type,
      sourceName: source.name,
      title: item.title || "Untitled RSS Item",
      text: item.description || item.title,
      url: item.link || source.feedUrl,
      createdAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      collectedAt,
      keywords: source.keywords ?? [],
      metadata: {
        feedUrl: source.feedUrl,
      },
    }))
}

async function collectWebPage(source: WebPageSourceConfig): Promise<RawDiscussion[]> {
  const response = await fetchWithTimeout(source.url)
  const html = await response.text()
  const text = sanitizeText(html)
  const chunks = text.split(/(?<=[.!?])\s+/).filter((chunk) => chunk.length > 40)
  const maxSnippets = Math.max(1, Math.min(source.maxSnippets ?? 20, 100))
  const loweredKeywords = (source.keywords ?? []).map((keyword) => keyword.toLowerCase())
  const collectedAt = new Date().toISOString()

  const selected = chunks
    .filter((chunk) => {
      if (loweredKeywords.length === 0) {
        return true
      }

      const loweredChunk = chunk.toLowerCase()
      return loweredKeywords.some((keyword) => loweredChunk.includes(keyword))
    })
    .slice(0, maxSnippets)

  return selected.map((chunk, index) => ({
    id: randomUUID(),
    sourceId: source.id,
    sourceType: source.type,
    sourceName: source.name,
    title: `${source.name} snippet ${index + 1}`,
    text: chunk,
    url: source.url,
    collectedAt,
    keywords: source.keywords ?? [],
    metadata: {
      selectorHint: source.selectorHint,
    },
  }))
}

export async function collectFromSource(source: SourceConfig): Promise<SourceResult> {
  try {
    if (!source.enabled) {
      return { source, items: [] }
    }

    const items = source.type === "reddit"
      ? await collectReddit(source)
      : source.type === "rss"
      ? await collectRss(source)
      : await collectWebPage(source)

    return {
      source,
      items,
    }
  } catch (error) {
    return {
      source,
      items: [],
      error: error instanceof Error ? error.message : "Unknown collection error",
    }
  }
}

export async function collectAllSources(sources: SourceConfig[]) {
  const results = await Promise.all(sources.map((source) => collectFromSource(source)))
  return results
}
