export type MetricStatus = "normal" | "high" | "low" | "critical-high" | "critical-low" | "missing"

export type ReportMetric = {
  id: string
  label: string
  unit: string
  value?: number
  status: MetricStatus
  normalMin?: number
  normalMax?: number
  domain: "metabolic" | "cardio" | "renal" | "hematology" | "nutrition"
}

export type WeakPoint = {
  metricId: string
  metricLabel: string
  value: string
  severity: "moderate" | "high" | "critical"
  reason: string
  suggestion: string
}

export type ReportInsightResult = {
  metrics: ReportMetric[]
  weakPoints: WeakPoint[]
  suggestions: string[]
  overallScore: number
  summary: string
  chartStatusData: Array<{ name: string; value: number; fill: string }>
  chartWeaknessData: Array<{ metric: string; severityScore: number }>
  chartDomainData: Array<{ domain: string; score: number }>
}

type MetricDefinition = {
  id: string
  label: string
  unit: string
  normalMin?: number
  normalMax?: number
  criticalMin?: number
  criticalMax?: number
  plausibleMin?: number
  plausibleMax?: number
  domain: ReportMetric["domain"]
  weight: number
  aliases: string[]
  patterns: RegExp[]
  suggestionLow?: string
  suggestionHigh?: string
}

const metricDefinitions: MetricDefinition[] = [
  {
    id: "hba1c",
    label: "HbA1c",
    unit: "%",
    normalMin: 4,
    normalMax: 5.6,
    criticalMax: 8,
    plausibleMin: 3,
    plausibleMax: 20,
    domain: "metabolic",
    weight: 12,
    aliases: ["hba1c", "hb a1c", "glycated hemoglobin", "a1c"],
    patterns: [/hba1c\s*[:=%-]?\s*(\d+(?:\.\d+)?)/i, /hb\s*a1c\s*[:=%-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Reduce refined sugar intake, follow diabetes meal timing, and discuss glucose-lowering treatment optimization.",
  },
  {
    id: "fasting-glucose",
    label: "Fasting Glucose",
    unit: "mg/dL",
    normalMin: 70,
    normalMax: 99,
    criticalMin: 55,
    criticalMax: 180,
    plausibleMin: 30,
    plausibleMax: 600,
    domain: "metabolic",
    weight: 10,
    aliases: ["fasting glucose", "fbs", "fasting blood sugar"],
    patterns: [/fasting glucose\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /fbs\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Take regular meals and review anti-diabetic dosing with your doctor.",
    suggestionHigh: "Increase fiber-rich meals, daily walking, and review medication adherence with clinician support.",
  },
  {
    id: "postprandial-glucose",
    label: "Postprandial Glucose",
    unit: "mg/dL",
    normalMax: 140,
    criticalMax: 260,
    plausibleMin: 40,
    plausibleMax: 700,
    domain: "metabolic",
    weight: 8,
    aliases: ["ppbs", "postprandial", "post meal glucose", "2hr pp"],
    patterns: [/ppbs\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /postprandial\s*(?:glucose)?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Review meal composition and anti-diabetic timing with your clinician.",
  },
  {
    id: "ldl",
    label: "LDL Cholesterol",
    unit: "mg/dL",
    normalMax: 99,
    criticalMax: 190,
    plausibleMin: 10,
    plausibleMax: 400,
    domain: "cardio",
    weight: 8,
    aliases: ["ldl", "ldl cholesterol", "ldl-c"],
    patterns: [/ldl\s*(?:cholesterol)?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Limit trans/saturated fats and discuss statin eligibility with your physician.",
  },
  {
    id: "hdl",
    label: "HDL Cholesterol",
    unit: "mg/dL",
    normalMin: 40,
    criticalMin: 30,
    plausibleMin: 10,
    plausibleMax: 150,
    domain: "cardio",
    weight: 7,
    aliases: ["hdl", "hdl cholesterol", "hdl-c"],
    patterns: [/hdl\s*(?:cholesterol)?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Add aerobic exercise, stop smoking, and include healthy fats (nuts, seeds, fish).",
  },
  {
    id: "triglycerides",
    label: "Triglycerides",
    unit: "mg/dL",
    normalMax: 149,
    criticalMax: 500,
    plausibleMin: 20,
    plausibleMax: 1200,
    domain: "cardio",
    weight: 8,
    aliases: ["triglycerides", "triglyceride", "tg"],
    patterns: [/triglycerides?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /\btg\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Reduce sugar/alcohol intake and review lipid control plan with your doctor.",
  },
  {
    id: "total-cholesterol",
    label: "Total Cholesterol",
    unit: "mg/dL",
    normalMax: 199,
    criticalMax: 280,
    plausibleMin: 60,
    plausibleMax: 500,
    domain: "cardio",
    weight: 7,
    aliases: ["total cholesterol", "cholesterol total"],
    patterns: [/total cholesterol\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Follow lipid-lowering diet and discuss cardiovascular risk management with your doctor.",
  },
  {
    id: "creatinine",
    label: "Creatinine",
    unit: "mg/dL",
    normalMin: 0.6,
    normalMax: 1.3,
    criticalMax: 2,
    plausibleMin: 0.2,
    plausibleMax: 15,
    domain: "renal",
    weight: 10,
    aliases: ["creatinine", "serum creatinine"],
    patterns: [/creatinine\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Keep hydration adequate and seek renal function review with your physician.",
  },
  {
    id: "urea",
    label: "Urea",
    unit: "mg/dL",
    normalMin: 15,
    normalMax: 40,
    criticalMax: 80,
    plausibleMin: 5,
    plausibleMax: 300,
    domain: "renal",
    weight: 6,
    aliases: ["urea", "blood urea", "bun"],
    patterns: [/urea\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /\bbun\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionHigh: "Review hydration, renal status, and protein load with your physician.",
  },
  {
    id: "hemoglobin",
    label: "Hemoglobin",
    unit: "g/dL",
    normalMin: 12,
    normalMax: 16,
    criticalMin: 8,
    criticalMax: 19,
    plausibleMin: 4,
    plausibleMax: 24,
    domain: "hematology",
    weight: 9,
    aliases: ["hemoglobin", "haemoglobin", "hb"],
    patterns: [/hemoglobin\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /\bhb\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Evaluate iron, B12, and folate status; improve iron-protein intake under clinician guidance.",
    suggestionHigh: "Review causes of high hemoglobin such as dehydration or chronic hypoxia with your doctor.",
  },
  {
    id: "wbc",
    label: "WBC",
    unit: "x10^3/uL",
    normalMin: 4,
    normalMax: 11,
    criticalMin: 2,
    criticalMax: 20,
    plausibleMin: 0.5,
    plausibleMax: 60,
    domain: "hematology",
    weight: 7,
    aliases: ["wbc", "total leucocyte count", "tlc", "white blood cell"],
    patterns: [/\bwbc\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /\btlc\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Discuss low WBC risk (infection risk) with your doctor urgently.",
    suggestionHigh: "High WBC may indicate infection/inflammation; correlate clinically with physician advice.",
  },
  {
    id: "platelets",
    label: "Platelets",
    unit: "x10^3/uL",
    normalMin: 150,
    normalMax: 450,
    criticalMin: 50,
    criticalMax: 1000,
    plausibleMin: 5,
    plausibleMax: 1500,
    domain: "hematology",
    weight: 7,
    aliases: ["platelet", "platelets", "plt"],
    patterns: [/platelets?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /\bplt\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Low platelets raise bleeding risk; seek medical review promptly.",
    suggestionHigh: "High platelets need clinical correlation for inflammation/hematologic causes.",
  },
  {
    id: "vitamin-d",
    label: "Vitamin D",
    unit: "ng/mL",
    normalMin: 30,
    normalMax: 100,
    criticalMin: 10,
    plausibleMin: 2,
    plausibleMax: 200,
    domain: "nutrition",
    weight: 6,
    aliases: ["vitamin d", "vit d", "25 oh vitamin d", "25-oh"],
    patterns: [/vitamin\s*d\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Use supervised Vitamin D supplementation and safe sunlight exposure.",
  },
  {
    id: "vitamin-b12",
    label: "Vitamin B12",
    unit: "pg/mL",
    normalMin: 200,
    normalMax: 900,
    criticalMin: 120,
    plausibleMin: 50,
    plausibleMax: 3000,
    domain: "nutrition",
    weight: 6,
    aliases: ["vitamin b12", "b12", "vit b12"],
    patterns: [/vitamin\s*b12\s*[:=-]?\s*(\d+(?:\.\d+)?)/i, /\bb12\b\s*[:=-]?\s*(\d+(?:\.\d+)?)/i],
    suggestionLow: "Discuss B12 supplementation and dietary correction (eggs, dairy, fish, fortified foods).",
  },
]

function normalizeOCRText(rawText: string) {
  return rawText
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/(?<=\d)[oO](?=\d)/g, "0")
    .replace(/(?<=\d)[lI](?=\d)/g, "1")
    .toLowerCase()
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function containsAliasToken(text: string, alias: string) {
  const escaped = escapeRegExp(alias)
  const aliasPattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i")
  return aliasPattern.test(text)
}

function isWithinPlausibleRange(value: number, definition: MetricDefinition) {
  if (definition.plausibleMin !== undefined && value < definition.plausibleMin) {
    return false
  }

  if (definition.plausibleMax !== undefined && value > definition.plausibleMax) {
    return false
  }

  return true
}

function pickBestValue(candidates: number[], definition: MetricDefinition) {
  const valid = candidates.filter((value) => Number.isFinite(value))
  const plausible = valid.filter((value) => isWithinPlausibleRange(value, definition))

  if (plausible.length > 0) {
    return plausible[0]
  }

  return valid[0]
}

function extractValueByPatterns(text: string, definition: MetricDefinition) {
  const extractedValues: number[] = []

  for (const pattern of definition.patterns) {
    const match = text.match(pattern)
    if (!match) {
      continue
    }

    const value = Number(match[1])
    if (Number.isFinite(value)) {
      extractedValues.push(value)
    }
  }

  return pickBestValue(extractedValues, definition)
}

function extractValueByAliases(rawText: string, definition: MetricDefinition) {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = 0; index < lines.length; index += 1) {
    const normalizedLine = normalizeOCRText(lines[index])
    const hasAlias = definition.aliases.some((alias) => containsAliasToken(normalizedLine, alias))

    if (!hasAlias) {
      continue
    }

    const valuesInLine = (normalizedLine.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
    const candidateInLine = pickBestValue(valuesInLine, definition)
    if (candidateInLine !== undefined) {
      return candidateInLine
    }

    const nextLine = lines[index + 1]
    if (nextLine) {
      const valuesInNextLine = (normalizeOCRText(nextLine).match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
      const candidateInNextLine = pickBestValue(valuesInNextLine, definition)
      if (candidateInNextLine !== undefined) {
        return candidateInNextLine
      }
    }
  }

  return undefined
}

function extractValue(rawText: string, definition: MetricDefinition) {
  const normalized = normalizeOCRText(rawText)

  const fromPattern = extractValueByPatterns(normalized, definition)
  if (fromPattern !== undefined) {
    return fromPattern
  }

  return extractValueByAliases(rawText, definition)
}

function evaluateStatus(definition: MetricDefinition, value?: number): MetricStatus {
  if (value === undefined) {
    return "missing"
  }

  if (definition.criticalMin !== undefined && value < definition.criticalMin) {
    return "critical-low"
  }

  if (definition.criticalMax !== undefined && value > definition.criticalMax) {
    return "critical-high"
  }

  if (definition.normalMin !== undefined && value < definition.normalMin) {
    return "low"
  }

  if (definition.normalMax !== undefined && value > definition.normalMax) {
    return "high"
  }

  return "normal"
}

function toSeverityScore(status: MetricStatus) {
  if (status === "critical-high" || status === "critical-low") {
    return 3
  }

  if (status === "high" || status === "low") {
    return 2
  }

  return 0
}

function toSeverityLabel(score: number): WeakPoint["severity"] {
  if (score >= 3) {
    return "critical"
  }

  if (score >= 2) {
    return "high"
  }

  return "moderate"
}

function getSuggestion(definition: MetricDefinition, status: MetricStatus) {
  if (status === "low" || status === "critical-low") {
    return definition.suggestionLow ?? `Discuss low ${definition.label} with your clinician for targeted correction.`
  }

  if (status === "high" || status === "critical-high") {
    return definition.suggestionHigh ?? `Discuss high ${definition.label} with your clinician and optimize your treatment plan.`
  }

  return `Maintain current care plan and continue routine monitoring of ${definition.label}.`
}

function getReason(definition: MetricDefinition, status: MetricStatus) {
  const rangeMin = definition.normalMin !== undefined ? `${definition.normalMin}` : "-"
  const rangeMax = definition.normalMax !== undefined ? `${definition.normalMax}` : "-"

  if (status === "low" || status === "critical-low") {
    return `${definition.label} is below reference range (${rangeMin}-${rangeMax} ${definition.unit}).`
  }

  return `${definition.label} is above reference range (${rangeMin}-${rangeMax} ${definition.unit}).`
}

export function analyzeMedicalReportText(rawText: string): ReportInsightResult {
  const metrics: ReportMetric[] = metricDefinitions.map((definition) => {
    const value = extractValue(rawText, definition)
    const status = evaluateStatus(definition, value)

    return {
      id: definition.id,
      label: definition.label,
      unit: definition.unit,
      value,
      status,
      normalMin: definition.normalMin,
      normalMax: definition.normalMax,
      domain: definition.domain,
    }
  })

  const weakPoints: WeakPoint[] = metrics
    .filter((metric) => metric.value !== undefined && metric.status !== "normal" && metric.status !== "missing")
    .map((metric) => {
      const definition = metricDefinitions.find((item) => item.id === metric.id)
      const severityScore = toSeverityScore(metric.status)
      const valueLabel = metric.value !== undefined ? `${metric.value} ${metric.unit}` : "Not found"

      return {
        metricId: metric.id,
        metricLabel: metric.label,
        value: valueLabel,
        severity: toSeverityLabel(severityScore),
        reason: getReason(definition!, metric.status),
        suggestion: getSuggestion(definition!, metric.status),
      }
    })
    .sort((left, right) => {
      const scoreMap = { moderate: 1, high: 2, critical: 3 }
      return scoreMap[right.severity] - scoreMap[left.severity]
    })

  const suggestionSet = new Set<string>()
  for (const weakPoint of weakPoints) {
    suggestionSet.add(weakPoint.suggestion)
  }

  const foundMetrics = metrics.filter((metric) => metric.value !== undefined)
  let overallScore = 100

  for (const metric of metrics) {
    const definition = metricDefinitions.find((item) => item.id === metric.id)
    const severityScore = toSeverityScore(metric.status)
    overallScore -= severityScore * (definition?.weight ?? 0)
  }

  overallScore = Math.max(0, Math.min(100, overallScore))

  const statusCounts = {
    normal: metrics.filter((metric) => metric.status === "normal").length,
    warning: metrics.filter((metric) => metric.status === "high" || metric.status === "low").length,
    critical: metrics.filter((metric) => metric.status === "critical-high" || metric.status === "critical-low").length,
  }

  const chartStatusData = [
    { name: "Normal", value: statusCounts.normal, fill: "hsl(var(--accent))" },
    { name: "Warning", value: statusCounts.warning, fill: "hsl(var(--chart-4))" },
    { name: "Critical", value: statusCounts.critical, fill: "hsl(var(--destructive))" },
  ]

  const chartWeaknessData = weakPoints.map((weakPoint) => ({
    metric: weakPoint.metricLabel,
    severityScore: weakPoint.severity === "critical" ? 3 : weakPoint.severity === "high" ? 2 : 1,
  }))

  const domainScoreMap: Record<ReportMetric["domain"], { total: number; penalty: number }> = {
    metabolic: { total: 0, penalty: 0 },
    cardio: { total: 0, penalty: 0 },
    renal: { total: 0, penalty: 0 },
    hematology: { total: 0, penalty: 0 },
    nutrition: { total: 0, penalty: 0 },
  }

  for (const metric of metrics) {
    const definition = metricDefinitions.find((item) => item.id === metric.id)
    if (!definition) {
      continue
    }

    domainScoreMap[metric.domain].total += definition.weight
    domainScoreMap[metric.domain].penalty += toSeverityScore(metric.status) * definition.weight
  }

  const chartDomainData = Object.entries(domainScoreMap).map(([domain, values]) => {
    const score = values.total === 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - (values.penalty / values.total) * 100)))
    return {
      domain: domain[0].toUpperCase() + domain.slice(1),
      score,
    }
  })

  const summary = foundMetrics.length === 0
    ? "No recognized lab values were found. Upload a clearer report image or text with labels like HbA1c, glucose, LDL, creatinine, hemoglobin, vitamin D, and B12."
    : weakPoints.length === 0
      ? `Detected ${foundMetrics.length} real metric value(s). All extracted markers are within configured reference ranges.`
      : `${weakPoints.length} weak point(s) were found from ${foundMetrics.length} extracted real metric value(s). Prioritize critical items first with physician guidance.`

  return {
    metrics,
    weakPoints,
    suggestions: Array.from(suggestionSet),
    overallScore,
    summary,
    chartStatusData,
    chartWeaknessData,
    chartDomainData,
  }
}
