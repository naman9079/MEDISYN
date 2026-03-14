import path from "node:path"
import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { NextRequest, NextResponse } from "next/server"
import { buildFallbackInsights } from "@/lib/biosentvec/fallback"
import { biomedicalReferenceCorpus, type BiomedicalReference } from "@/lib/biosentvec/reference-corpus"
import { getRecentRawDiscussions } from "@/lib/data-collection/db"
import { getWorkspacePython } from "@/lib/python-runtime"

type BioSentVecMatch = {
  id: string
  similarity: number
}

type BioSentVecBridgeResponse = {
  provider: "biosentvec"
  preprocessedText: string
  vectorDimension: number
  topMatches: BioSentVecMatch[]
}

const conditionHints: string[] = []

const treatmentHints: string[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = typeof body?.text === "string" ? body.text.trim() : ""

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 })
    }

    const result = await analyzeBiomedicalText(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Unable to analyze biomedical text." }, { status: 500 })
  }
}

async function analyzeBiomedicalText(text: string) {
  const dynamicCorpus = await buildDynamicReferenceCorpus()

  try {
    return await runBioSentVec(text, dynamicCorpus)
  } catch (error) {
    const focusedCorpus = focusCorpusByQuery(text, dynamicCorpus)
    const fallback = buildFallbackInsights(text, focusedCorpus)
    const diseaseHints = conditionHints.filter((hint) => text.toLowerCase().includes(hint))

    const reranked = [...fallback.topMatches]
      .map((match) => {
        const conditionText = match.condition.toLowerCase()
        const treatmentText = match.treatment.toLowerCase()
        const diseaseBoost = diseaseHints.some((hint) => conditionText.includes(hint) || treatmentText.includes(hint)) ? 0.2 : 0

        return {
          ...match,
          _score: match.similarity + diseaseBoost,
        }
      })
      .sort((left, right) => right._score - left._score)
      .map(({ _score, ...rest }) => rest)

    const topCategories = [...new Set(reranked.map((match) => match.category))]
    const summary = reranked[0]
      ? `Closest match: ${reranked[0].title} for ${reranked[0].condition}.`
      : fallback.summary

    return {
      ...fallback,
      summary,
      topCategories,
      topMatches: reranked,
      note:
        error instanceof Error
          ? `${error.message} Using ${focusedCorpus.length} local reference discussions for fallback.`
          : "BioSentVec is unavailable. Falling back to token-based similarity.",
    }
  }
}

async function runBioSentVec(text: string, corpus: BiomedicalReference[]) {
  const modelPath = process.env.BIOSENTVEC_MODEL_PATH

  if (!modelPath) {
    throw new Error("Set BIOSENTVEC_MODEL_PATH to a local BioSentVec .bin model to enable embedding-based analysis.")
  }

  const pythonExecutable = process.env.BIOSENTVEC_PYTHON || getWorkspacePython()
  const bridgeScript = path.join(process.cwd(), "scripts", "biosentvec_bridge.py")
  const payload = JSON.stringify({
    text,
    candidates: corpus.map((reference) => ({
      id: reference.id,
      text: reference.text,
    })),
  })

  const stdout = await runBridgeProcess(pythonExecutable, bridgeScript, modelPath, payload)

  const bridgeResult = JSON.parse(stdout) as BioSentVecBridgeResponse
  const enrichedMatches = bridgeResult.topMatches.map((match) => {
    const reference = corpus.find((candidate) => candidate.id === match.id)

    if (!reference) {
      throw new Error(`Unknown BioSentVec candidate returned: ${match.id}`)
    }

    return {
      ...reference,
      similarity: match.similarity,
    }
  })

  return {
    provider: bridgeResult.provider,
    preprocessedText: bridgeResult.preprocessedText,
    vectorDimension: bridgeResult.vectorDimension,
    summary: enrichedMatches[0]
      ? `Top BioSentVec match: ${enrichedMatches[0].title} for ${enrichedMatches[0].condition}.`
      : "No BioSentVec match was returned.",
    topCategories: [...new Set(enrichedMatches.map((match) => match.category))],
    topMatches: enrichedMatches,
  }
}

async function buildDynamicReferenceCorpus() {
  try {
    const rows = await getRecentRawDiscussions(400)
    const curated = loadCuratedPatientExperienceCorpus()

    const mapped = rows
      .map((row, index): BiomedicalReference | null => {
        const combined = `${row.title} ${row.text}`.toLowerCase()
        const title = row.title?.trim() || `Collected discussion ${index + 1}`
        const text = row.text?.trim() || title

        if (!text) {
          return null
        }

        const category = inferCategory(combined)
        const treatment = pickBestHint(combined, treatmentHints) || row.sourceName || "General treatment"
        const conditionFromSource = inferConditionFromSource(`${row.sourceId} ${row.sourceName}`)
        const conditionFromText = pickBestHint(combined, conditionHints)
        const condition = conditionFromSource || conditionFromText || "General condition"

        return {
          id: `raw-${row.id}`,
          title,
          category,
          treatment: toTitleCase(treatment),
          condition: toTitleCase(condition),
          text,
        }
      })
      .filter((entry): entry is BiomedicalReference => Boolean(entry))

    if (mapped.length >= 20) {
      return [...curated, ...mapped]
    }

    return [...curated, ...biomedicalReferenceCorpus, ...mapped]
  } catch {
    return [...loadCuratedPatientExperienceCorpus(), ...biomedicalReferenceCorpus]
  }
}

function loadCuratedPatientExperienceCorpus(): BiomedicalReference[] {
  try {
    const filePath = path.join(process.cwd(), "data", "real", "patient-experiences.json")
    const content = readFileSync(filePath, "utf8")
    const parsed = JSON.parse(content) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((entry, index): BiomedicalReference | null => {
        if (typeof entry !== "object" || entry === null) {
          return null
        }

        const row = entry as Record<string, unknown>
        const treatment = typeof row.treatment === "string" ? row.treatment : "General treatment"
        const condition = typeof row.condition === "string" ? row.condition : "General condition"
        const text = typeof row.content === "string" && row.content.trim().length > 0
          ? row.content.trim()
          : `${treatment} experience for ${condition}`
        const title = typeof row.id === "string" ? row.id : `curated-${index + 1}`
        const textLowered = text.toLowerCase()

        return {
          id: `curated-${index + 1}`,
          title: `${treatment} for ${condition}`,
          category: inferCategory(textLowered),
          treatment,
          condition,
          text,
        }
      })
      .filter((entry): entry is BiomedicalReference => Boolean(entry))
  } catch {
    return []
  }
}

function inferCategory(text: string): BiomedicalReference["category"] {
  if (/side effect|adverse|toxicity|fatigue|nausea|pain|neuropathy|risk/.test(text)) {
    return "safety"
  }

  if (/adherence|compliance|missed dose|discontinue|titration|tolerability/.test(text)) {
    return "adherence"
  }

  if (/improv|response|outcome|recovery|progression|remission|stabil/.test(text)) {
    return "outcome"
  }

  return "therapy"
}

function pickBestHint(text: string, hints: string[]) {
  let match: string | null = null

  for (const hint of hints) {
    if (text.includes(hint)) {
      if (!match || hint.length > match.length) {
        match = hint
      }
    }
  }

  return match
}

function inferConditionFromSource(sourceName: string) {
  const lowered = sourceName.toLowerCase().trim()

  if (lowered.length > 0) return lowered
  return null
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}

function focusCorpusByQuery(query: string, corpus: BiomedicalReference[]) {
  const lowered = query.toLowerCase()
  const matchedHints = [...conditionHints, ...treatmentHints].filter((hint) => lowered.includes(hint))

  if (matchedHints.length === 0) {
    return corpus
  }

  const focused = corpus.filter((item) => {
    const text = `${item.title} ${item.text} ${item.condition} ${item.treatment}`.toLowerCase()
    return matchedHints.some((hint) => text.includes(hint))
  })

  return focused.length >= 5 ? focused : corpus
}

function runBridgeProcess(
  pythonExecutable: string,
  bridgeScript: string,
  modelPath: string,
  payload: string,
) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(pythonExecutable, [bridgeScript, "--model", modelPath], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""
    let settled = false

    const timer = setTimeout(() => {
      if (settled) {
        return
      }

      settled = true
      child.kill()
      reject(new Error("BioSentVec bridge timed out after 30 seconds."))
    }, 30000)

    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")

    child.stdout.on("data", (chunk) => {
      stdout += chunk
    })

    child.stderr.on("data", (chunk) => {
      stderr += chunk
    })

    child.on("error", (error) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timer)
      reject(error)
    })

    child.on("close", (code) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timer)

      if (code !== 0) {
        reject(new Error(stderr.trim() || `BioSentVec bridge exited with code ${code}.`))
        return
      }

      resolve(stdout)
    })

    child.stdin.write(payload)
    child.stdin.end()
  })
}