export type SemanticMatch = {
  id: string
  title: string
  category: "therapy" | "safety" | "adherence" | "outcome"
  treatment: string
  condition: string
  text: string
  similarity: number
}

export type SemanticSearchResponse = {
  provider: "sentence-transformers" | "fallback"
  model: string
  summary: string
  topMatches: SemanticMatch[]
  note?: string
}

export async function analyzeSemanticMatches(text: string) {
  const response = await fetch("/api/sentence-transformers/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  })

  const result = (await response.json()) as SemanticSearchResponse | { error: string }

  if (!response.ok || "error" in result) {
    throw new Error("error" in result ? result.error : "Semantic search failed")
  }

  return result
}