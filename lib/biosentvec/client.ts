export type AnalyzerMatch = {
  id: string
  title: string
  category: "therapy" | "safety" | "adherence" | "outcome"
  treatment: string
  condition: string
  text: string
  similarity: number
}

export type AnalyzerResponse = {
  provider: "biosentvec" | "fallback"
  preprocessedText: string
  vectorDimension?: number
  summary: string
  topCategories: string[]
  topMatches: AnalyzerMatch[]
  note?: string
}

export async function analyzeBiomedicalText(text: string) {
  const response = await fetch("/api/biosentvec/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  })

  const result = (await response.json()) as AnalyzerResponse | { error: string }

  if (!response.ok || "error" in result) {
    throw new Error("error" in result ? result.error : "Analysis failed")
  }

  return result
}