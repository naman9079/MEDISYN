import path from "node:path"
import { readFile } from "node:fs/promises"
import { NextRequest, NextResponse } from "next/server"
import { getRecentRawDiscussions } from "@/lib/data-collection/db"
import type { RawDiscussion } from "@/lib/data-collection/types"
import { inferConditionFromText } from "@/lib/conditions"

type ExperienceSentiment = "positive" | "neutral" | "negative"

type PatientExperience = {
  id: string
  author: string
  initials: string
  treatment: string
  condition: string
  date: string
  content: string
  tags: string[]
  sentiment: ExperienceSentiment
  credibilityScore: number
  likes: number
  replies: number
  verified: boolean
  sourceUrl?: string
}

type DataSource = "realtime-db" | "real-file" | "fallback"

const fallbackExperiences: PatientExperience[] = []

const MAX_CARD_CONTENT_LENGTH = 360

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function trimForCard(value: string) {
  if (value.length <= MAX_CARD_CONTENT_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_CARD_CONTENT_LENGTH).trimEnd()}...`
}

function toDateString(value: string | undefined) {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }

  return parsed.toISOString().slice(0, 10)
}

function getInitials(author: string) {
  const letters = author
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)

  return letters || "U"
}

function inferCondition(raw: RawDiscussion) {
  const metadataCondition = raw.metadata?.condition
  if (typeof metadataCondition === "string" && metadataCondition.trim().length > 0) {
    return titleCase(metadataCondition.toLowerCase())
  }

  const sourceNameMatch = raw.sourceName?.match(/^(.+?)\s+Patient\s+Experiences/i)
  if (sourceNameMatch?.[1]) {
    return titleCase(sourceNameMatch[1].toLowerCase())
  }

  const sourceIdMatch = raw.sourceId?.match(/^reddit-(.+)$/i)
  if (sourceIdMatch?.[1]) {
    return titleCase(sourceIdMatch[1].replace(/-/g, " ").toLowerCase())
  }

  const inferred = inferConditionFromText(`${raw.title} ${raw.text} ${(raw.keywords ?? []).join(" ")}`)
  if (inferred) {
    return inferred
  }

  return "Custom Condition"
}

function inferTreatment(raw: RawDiscussion) {
  const metadataTreatment = raw.metadata?.treatment
  if (typeof metadataTreatment === "string" && metadataTreatment.trim().length > 0) {
    return titleCase(metadataTreatment.toLowerCase())
  }

  return raw.sourceName || "Custom Treatment"
}

function inferTags(text: string) {
  const lower = text.toLowerCase()
  const tags = new Set<string>()

  if (/(side effect|nausea|fatigue|pain|cough|dizzy|insomnia|neuropathy)/.test(lower)) {
    tags.add("Side Effects")
  }
  if (/(improv|better|recover|stabil|respond|controlled)/.test(lower)) {
    tags.add("Recovery")
  }
  if (/(result|outcome|progress|response|stable|remission)/.test(lower)) {
    tags.add("Outcome")
  }

  if (tags.size === 0) {
    tags.add("Outcome")
  }

  return Array.from(tags)
}

function inferSentiment(text: string): ExperienceSentiment {
  const lower = text.toLowerCase()
  const positiveHits = (lower.match(/(improv|better|good|stable|helped|effective|controlled)/g) ?? []).length
  const negativeHits = (lower.match(/(worse|severe|pain|fatigue|nausea|anxious|concern|scared)/g) ?? []).length

  if (positiveHits > negativeHits) {
    return "positive"
  }

  if (negativeHits > positiveHits) {
    return "negative"
  }

  return "neutral"
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function inferCredibility(raw: RawDiscussion, text: string) {
  const sourceScore = raw.sourceType === "reddit" ? 8 : raw.sourceType === "rss" ? 5 : 3
  const detailScore = clamp(Math.floor(text.length / 60), 0, 10)
  return clamp(75 + sourceScore + detailScore, 70, 98)
}

function normalizeSourceType(value: string): RawDiscussion["sourceType"] {
  if (value === "reddit" || value === "rss" || value === "web-page") {
    return value
  }

  return "web-page"
}

function dedupeDiscussions(items: RawDiscussion[]) {
  const seen = new Set<string>()
  const results: RawDiscussion[] = []

  for (const item of items) {
    const key = cleanText(`${item.title.toLowerCase()}|${item.text.toLowerCase().slice(0, 260)}`)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    results.push(item)
  }

  return results
}

function mapRawToExperience(raw: RawDiscussion): PatientExperience | null {
  const content = trimForCard(cleanText(raw.text))
  if (content.length < 45) {
    return null
  }

  const author = raw.author?.trim() || `User ${raw.id.slice(0, 4).toUpperCase()}`
  const likes = Number(raw.metadata?.upvotes)
  const replies = Number(raw.metadata?.comments)

  return {
    id: raw.id,
    author,
    initials: getInitials(author),
    treatment: inferTreatment(raw),
    condition: inferCondition(raw),
    date: toDateString(raw.createdAt ?? raw.collectedAt),
    content,
    tags: inferTags(content),
    sentiment: inferSentiment(content),
    credibilityScore: inferCredibility(raw, content),
    likes: Number.isFinite(likes) ? Math.max(0, likes) : 0,
    replies: Number.isFinite(replies) ? Math.max(0, replies) : 0,
    verified: raw.sourceType !== "web-page",
    sourceUrl: raw.url,
  }
}

function looksLikePatientExperience(raw: RawDiscussion) {
  const text = `${raw.title} ${raw.text}`.toLowerCase()
  return /(diagnos|treatment|medication|therapy|dose|side effect|symptom|improv|worse|recovery|outcome)/.test(text)
}

function prioritizeDiscussionSources(items: RawDiscussion[]) {
  const reddit = items.filter((item) => item.sourceType === "reddit")
  const rss = items.filter((item) => item.sourceType === "rss")
  const web = items.filter((item) => item.sourceType === "web-page")

  if (reddit.length >= 20) {
    return reddit
  }

  if (reddit.length + rss.length >= 20) {
    return [...reddit, ...rss]
  }

  return [...reddit, ...rss, ...web]
}

async function fromRealtimeDb(limit = 120, sourceType?: "reddit" | "rss" | "web-page"): Promise<PatientExperience[]> {
  const recent = await getRecentRawDiscussions(limit, sourceType)
  const normalized: RawDiscussion[] = recent.map((item) => ({
    ...item,
    sourceType: normalizeSourceType(item.sourceType),
  }))
  const unique = dedupeDiscussions(normalized)
  const prioritized = prioritizeDiscussionSources(unique).filter(looksLikePatientExperience)
  const mapped = prioritized
    .map(mapRawToExperience)
    .filter((item): item is PatientExperience => item !== null)

  return mapped
}

function isPatientExperience(value: unknown): value is PatientExperience {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.id === "string" &&
    typeof record.author === "string" &&
    typeof record.initials === "string" &&
    typeof record.treatment === "string" &&
    typeof record.condition === "string" &&
    typeof record.date === "string" &&
    typeof record.content === "string" &&
    Array.isArray(record.tags) &&
    record.tags.every((tag) => typeof tag === "string") &&
    (record.sentiment === "positive" || record.sentiment === "neutral" || record.sentiment === "negative") &&
    typeof record.credibilityScore === "number" &&
    typeof record.likes === "number" &&
    typeof record.replies === "number" &&
    typeof record.verified === "boolean" &&
    (record.sourceUrl === undefined || typeof record.sourceUrl === "string")
  )
}

export async function GET(request: NextRequest) {
  const realDataPath = path.join(process.cwd(), "data", "real", "patient-experiences.json")
  try {
    const fileContent = await readFile(realDataPath, "utf8")
    const parsed = JSON.parse(fileContent) as unknown
    if (!Array.isArray(parsed)) {
      throw new Error("Real data file must contain an array.")
    }
    const items = parsed.filter(isPatientExperience)
    return NextResponse.json({
      source: "real-file" satisfies DataSource,
      path: "data/real/patient-experiences.json",
      note: items.length === 0 ? "No patient records configured yet. Add your own records to data/real/patient-experiences.json." : undefined,
      items,
    })
  } catch {
    return NextResponse.json({
      source: "fallback" satisfies DataSource,
      path: "built-in",
      note: "No built-in disease records are configured. Add your own records in data/real/patient-experiences.json.",
      items: fallbackExperiences,
    })
  }
}
