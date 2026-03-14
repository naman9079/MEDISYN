export type SciSpacyEntity = {
  text: string
  label: string
  start: number
  end: number
  normalized?: string
  longForm?: string
  links?: Array<{
    id: string
    score: number
    name?: string
    definition?: string
  }>
}

export type SciSpacyResponse = {
  provider: "scispacy" | "fallback"
  model: string
  abbreviations: Array<{
    short: string
    long: string
  }>
  entities: SciSpacyEntity[]
  note?: string
}

export type AnalyzeMedicalEntitiesOptions = {
  modelName?: string
  linkerName?: "mesh" | "rxnorm" | "umls" | "go" | "hpo"
}

export async function analyzeMedicalEntities(text: string, options?: AnalyzeMedicalEntitiesOptions) {
  const response = await fetch("/api/scispacy/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      modelName: options?.modelName,
      linkerName: options?.linkerName,
    }),
  })

  const result = (await response.json()) as SciSpacyResponse | { error: string }

  if (!response.ok || "error" in result) {
    throw new Error("error" in result ? result.error : "Medical entity extraction failed")
  }

  return result
}