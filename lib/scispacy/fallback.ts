import { medicalEntitySeeds } from "@/lib/scispacy/reference-entities"

export type ExtractedEntity = {
  text: string
  label: "TREATMENT" | "CONDITION" | "SYMPTOM" | "BIOMARKER"
  start: number
  end: number
  normalized: string
}

export type AbbreviationPair = {
  short: string
  long: string
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractAbbreviations(text: string) {
  const abbreviations: AbbreviationPair[] = []
  const pattern = /([A-Za-z][A-Za-z\-\s]{3,}?)\s*\(([A-Z][A-Z0-9\-]{1,10})\)/g

  for (const match of text.matchAll(pattern)) {
    const long = match[1]?.trim()
    const short = match[2]?.trim()

    if (long && short) {
      abbreviations.push({ short, long })
    }
  }

  return abbreviations
}

export function extractMedicalEntitiesFallback(text: string) {
  const normalizedText = text.toLowerCase()
  const entities: ExtractedEntity[] = []

  for (const seed of medicalEntitySeeds) {
    const pattern = new RegExp(`\\b${escapeRegExp(seed.text.toLowerCase())}s?\\b`, "g")

    for (const match of normalizedText.matchAll(pattern)) {
      const start = match.index ?? -1

      if (start < 0) {
        continue
      }

      entities.push({
        text: text.slice(start, start + match[0].length),
        label: seed.label,
        start,
        end: start + match[0].length,
        normalized: seed.canonical,
      })
    }
  }

  entities.sort((left, right) => left.start - right.start || left.end - right.end)

  return {
    provider: "fallback" as const,
    model: "rule-based-fallback",
    abbreviations: extractAbbreviations(text),
    entities,
    note: "SciSpaCy is unavailable. Falling back to rule-based biomedical term extraction.",
  }
}