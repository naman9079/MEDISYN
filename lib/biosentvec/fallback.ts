import { biomedicalReferenceCorpus, type BiomedicalReference } from "@/lib/biosentvec/reference-corpus"

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "may",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "with",
])

export type RankedReference = BiomedicalReference & {
  similarity: number
}

export function preprocessBiomedicalText(text: string) {
  return text
    .replaceAll("/", " / ")
    .replaceAll(".-", " .- ")
    .replaceAll(".", " . ")
    .replaceAll("'", " ' ")
    .toLowerCase()
    .replace(/[^a-z0-9+\-./\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(text: string) {
  return preprocessBiomedicalText(text)
    .split(" ")
    .filter((token) => token && !stopWords.has(token))
}

function toVector(tokens: string[]) {
  const counts = new Map<string, number>()

  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }

  return counts
}

function cosineSimilarity(left: Map<string, number>, right: Map<string, number>) {
  let dotProduct = 0
  let leftNorm = 0
  let rightNorm = 0

  for (const value of left.values()) {
    leftNorm += value * value
  }

  for (const value of right.values()) {
    rightNorm += value * value
  }

  for (const [token, leftValue] of left.entries()) {
    dotProduct += leftValue * (right.get(token) ?? 0)
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm))
}

export function rankBiomedicalReferences(text: string, corpus: BiomedicalReference[] = biomedicalReferenceCorpus): RankedReference[] {
  const queryVector = toVector(tokenize(text))

  return corpus
    .map((reference) => ({
      ...reference,
      similarity: cosineSimilarity(queryVector, toVector(tokenize(reference.text))),
    }))
    .sort((left, right) => right.similarity - left.similarity)
}

export function buildFallbackInsights(text: string, corpus: BiomedicalReference[] = biomedicalReferenceCorpus) {
  const ranked = rankBiomedicalReferences(text, corpus)
  const topMatches = ranked.slice(0, 3)
  const hasMeaningfulMatch = topMatches.some((match) => match.similarity > 0)
  const topCategories = hasMeaningfulMatch
    ? [...new Set(topMatches.map((match) => match.category))]
    : []

  const summary = hasMeaningfulMatch
    ? `Closest match: ${topMatches[0].title} for ${topMatches[0].condition}.`
    : "No close biomedical reference match was found for this input. Try adding treatment, symptom, or condition context."

  return {
    provider: "fallback",
    preprocessedText: preprocessBiomedicalText(text),
    summary,
    topCategories,
    topMatches,
  }
}