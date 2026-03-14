import path from "node:path"
import { spawn } from "node:child_process"
import { NextRequest, NextResponse } from "next/server"
import { rankBiomedicalReferences } from "@/lib/biosentvec/fallback"
import { biomedicalReferenceCorpus } from "@/lib/biosentvec/reference-corpus"
import { getWorkspacePython } from "@/lib/python-runtime"

type BridgeMatch = {
  id: string
  similarity: number
}

type BridgeResponse = {
  provider: "sentence-transformers"
  model: string
  topMatches: BridgeMatch[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = typeof body?.text === "string" ? body.text.trim() : ""

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 })
    }

    const result = await runSemanticSearch(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Unable to run semantic search." }, { status: 500 })
  }
}

async function runSemanticSearch(text: string) {
  try {
    return await runSentenceTransformers(text)
  } catch (error) {
    const fallbackMatches = rankBiomedicalReferences(text).slice(0, 5)

    return {
      provider: "fallback" as const,
      model: "token-cosine-fallback",
      summary: fallbackMatches[0]
        ? `Top semantic fallback match: ${fallbackMatches[0].title}.`
        : "No semantic fallback matches found.",
      topMatches: fallbackMatches,
      note: toSafeErrorMessage(error),
    }
  }
}

async function runSentenceTransformers(text: string) {
  const pythonExecutable = process.env.SENTENCE_TRANSFORMERS_PYTHON || process.env.BIOSENTVEC_PYTHON || getWorkspacePython()
  const modelName = process.env.SENTENCE_TRANSFORMERS_MODEL || "all-MiniLM-L6-v2"
  const bridgeScript = path.join(process.cwd(), "scripts", "sentence_transformers_bridge.py")

  const payload = JSON.stringify({
    text,
    modelName,
    candidates: biomedicalReferenceCorpus.map((reference) => ({
      id: reference.id,
      text: reference.text,
    })),
  })

  const stdout = await runBridgeProcess(pythonExecutable, bridgeScript, payload)
  const bridgeResponse = JSON.parse(stdout) as BridgeResponse

  const topMatches = bridgeResponse.topMatches.map((match) => {
    const reference = biomedicalReferenceCorpus.find((candidate) => candidate.id === match.id)

    if (!reference) {
      throw new Error(`Unknown semantic candidate returned: ${match.id}`)
    }

    return {
      ...reference,
      similarity: match.similarity,
    }
  })

  return {
    provider: bridgeResponse.provider,
    model: bridgeResponse.model,
    summary: topMatches[0]
      ? `Top semantic match: ${topMatches[0].title}.`
      : "No semantic matches returned.",
    topMatches,
  }
}

function toSafeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "sentence-transformers is unavailable. Using fallback semantic search."
  }

  const message = error.message

  if (message.includes("No module named 'sentence_transformers'")) {
    return "sentence-transformers package is not installed. Using fallback semantic search."
  }

  if (message.includes("No module named 'torch'")) {
    return "PyTorch is not installed for sentence-transformers. Using fallback semantic search."
  }

  if (message.includes("timed out")) {
    return "sentence-transformers request timed out. Using fallback semantic search."
  }

  return "sentence-transformers is unavailable. Using fallback semantic search."
}

function runBridgeProcess(
  pythonExecutable: string,
  bridgeScript: string,
  payload: string,
) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(pythonExecutable, [bridgeScript], {
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
      reject(new Error("sentence-transformers bridge timed out after 30 seconds."))
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
        reject(new Error(stderr.trim() || `sentence-transformers bridge exited with code ${code}.`))
        return
      }

      resolve(stdout)
    })

    child.stdin.write(payload)
    child.stdin.end()
  })
}