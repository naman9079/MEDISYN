import { NextResponse } from "next/server"
import { analyzeMedicalReportText } from "@/lib/report-insights"

type GeminiWeakPoint = {
  metric: string
  severity: "mild" | "moderate" | "high" | "critical"
  currentStatus: string
  whyItMatters: string
  howToImprove: string
}

type GeminiSummaryResponse = {
  reportSummary: string
  overallAssessment: string
  weakPoints: GeminiWeakPoint[]
  actionPlan: string[]
  urgentWarnings: string[]
  disclaimer: string
}

const geminiModelCandidates = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"]

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || ""
  return key.length > 0 ? key : null
}

function parseGeminiJson(rawText: string): GeminiSummaryResponse | null {
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as Partial<GeminiSummaryResponse>

    if (typeof parsed.reportSummary !== "string" || typeof parsed.overallAssessment !== "string") {
      return null
    }

    const weakPoints = Array.isArray(parsed.weakPoints)
      ? parsed.weakPoints.filter((point) => {
          return (
            point &&
            typeof point.metric === "string" &&
            typeof point.currentStatus === "string" &&
            typeof point.whyItMatters === "string" &&
            typeof point.howToImprove === "string" &&
            (point.severity === "mild" ||
              point.severity === "moderate" ||
              point.severity === "high" ||
              point.severity === "critical")
          )
        })
      : []

    const actionPlan = Array.isArray(parsed.actionPlan)
      ? parsed.actionPlan.filter((item): item is string => typeof item === "string")
      : []

    const urgentWarnings = Array.isArray(parsed.urgentWarnings)
      ? parsed.urgentWarnings.filter((item): item is string => typeof item === "string")
      : []

    const disclaimer = typeof parsed.disclaimer === "string"
      ? parsed.disclaimer
      : "AI summary is informational only and does not replace medical advice."

    return {
      reportSummary: parsed.reportSummary,
      overallAssessment: parsed.overallAssessment,
      weakPoints,
      actionPlan,
      urgentWarnings,
      disclaimer,
    }
  } catch {
    return null
  }
}

function normalizeSummaryPoints(summary: string) {
  const normalized = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[\-•\d.)\s]+/, "").trim())

  if (normalized.length > 1) {
    return normalized.map((line) => `• ${line}`).join("\n")
  }

  const sentencePoints = summary
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (sentencePoints.length > 1) {
    return sentencePoints.slice(0, 6).map((line) => `• ${line}`).join("\n")
  }

  return `• ${summary.trim()}`
}

function buildFallbackSummary(reportText: string): GeminiSummaryResponse {
  const local = analyzeMedicalReportText(reportText)

  const weakPoints: GeminiWeakPoint[] = local.weakPoints.slice(0, 8).map((point) => ({
    metric: point.metricLabel,
    severity: point.severity,
    currentStatus: point.value,
    whyItMatters: point.reason,
    howToImprove: point.suggestion,
  }))

  const urgentWarnings = local.weakPoints
    .filter((point) => point.severity === "critical")
    .slice(0, 4)
    .map((point) => `${point.metricLabel}: ${point.reason}`)

  return {
    reportSummary: normalizeSummaryPoints(local.summary),
    overallAssessment: `Local analysis score: ${local.overallScore}/100`,
    weakPoints,
    actionPlan: local.suggestions.slice(0, 8),
    urgentWarnings,
    disclaimer:
      "AI output is informational only. This response used local fallback analysis because Gemini was unavailable or rate-limited.",
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const reportText = typeof body?.reportText === "string" ? body.reportText.trim() : ""
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : ""
    const imageMimeType = typeof body?.imageMimeType === "string" ? body.imageMimeType.trim() : ""
    const hasImage = imageBase64.length > 0 && imageMimeType.startsWith("image/")

    if (!reportText && !hasImage) {
      return NextResponse.json({ error: "Report text or image is required." }, { status: 400 })
    }

    const geminiApiKey = getGeminiApiKey()
    if (!geminiApiKey) {
      return NextResponse.json({
        result: buildFallbackSummary(reportText),
        warning:
          "Gemini API key is missing. Add GEMINI_API_KEY (or GOOGLE_API_KEY) in .env.local to enable cloud AI summaries.",
      })
    }

    const prompt = [
      "You are a strict medical report summarizer for patient-friendly insights.",
      "Analyze the medical report input and return ONLY valid JSON with this exact shape:",
      "{",
      '  "reportSummary": "string",',
      '  "overallAssessment": "string",',
      '  "weakPoints": [',
      "    {",
      '      "metric": "string",',
      '      "severity": "mild|moderate|high|critical",',
      '      "currentStatus": "string",',
      '      "whyItMatters": "string",',
      '      "howToImprove": "string"',
      "    }",
      "  ],",
      '  "actionPlan": ["string"],',
      '  "urgentWarnings": ["string"],',
      '  "disclaimer": "string"',
      "}",
      "Rules:",
      "1) Use report evidence only. If uncertain, explicitly state uncertainty.",
      "2) Keep language simple and practical.",
      "3) Mention weak points and clear improvement steps.",
      "4) Do not provide diagnosis certainty; recommend clinician confirmation.",
      "5) reportSummary must be concise bullet-style points as one string using newline separators.",
      "6) Output must be JSON only (no markdown).",
      reportText ? "Report text (if available):" : "No reliable report text provided. Read the attached image carefully.",
      reportText || "[no-text]",
    ].join("\n")

    const contentParts: Array<Record<string, any>> = [{ text: prompt }]
    if (hasImage) {
      contentParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      })
    }

    let raw: Record<string, any> | null = null
    let lastErrorText = ""
    let lastStatus = 502

    for (const model of geminiModelCandidates) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: contentParts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      )

      if (response.ok) {
        raw = await response.json()
        break
      }

      lastStatus = response.status
      lastErrorText = await response.text()

      const canTryNextModel = response.status === 404 || response.status === 400
      if (!canTryNextModel) {
        break
      }
    }

    if (!raw) {
      if (hasImage && !reportText) {
        return NextResponse.json(
          {
            error: "Gemini could not analyze this image right now.",
            details: lastErrorText.slice(0, 500),
          },
          { status: 502 },
        )
      }

      return NextResponse.json({
        result: buildFallbackSummary(reportText),
        warning:
          lastStatus === 401 || lastStatus === 403
            ? "Gemini authentication failed. Showing local fallback summary."
            : "Gemini request failed or quota exceeded. Showing local fallback summary.",
        details: lastErrorText.slice(0, 500),
      })
    }

    const contentText = raw?.candidates?.[0]?.content?.parts?.[0]?.text

    if (typeof contentText !== "string") {
      return NextResponse.json({ error: "Gemini returned an unexpected response format." }, { status: 502 })
    }

    const parsed = parseGeminiJson(contentText)
    if (!parsed) {
      return NextResponse.json({
        result: buildFallbackSummary(reportText),
        warning: "Gemini response format was invalid. Showing local fallback summary.",
        raw: contentText.slice(0, 500),
      })
    }

    return NextResponse.json({
      result: {
        ...parsed,
        reportSummary: normalizeSummaryPoints(parsed.reportSummary),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to summarize report.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
