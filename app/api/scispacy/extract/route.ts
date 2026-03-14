import path from "node:path"
import { spawn } from "node:child_process"
import { NextRequest, NextResponse } from "next/server"
import { extractMedicalEntitiesFallback } from "@/lib/scispacy/fallback"
import { getWorkspacePython } from "@/lib/python-runtime"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = typeof body?.text === "string" ? body.text.trim() : ""
    const modelName = typeof body?.modelName === "string" ? body.modelName.trim() : ""
    const linkerName = typeof body?.linkerName === "string" ? body.linkerName.trim().toLowerCase() : ""

    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 })
    }

    const result = await extractMedicalEntities(text, {
      modelName,
      linkerName,
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Unable to extract medical entities." }, { status: 500 })
  }
}

async function extractMedicalEntities(
  text: string,
  options: {
    modelName?: string
    linkerName?: string
  },
) {
  try {
    return await runSciSpacy(text, options)
  } catch (error) {
    const fallback = extractMedicalEntitiesFallback(text)

    return {
      ...fallback,
      note: toSafeErrorMessage(error, fallback.note),
    }
  }
}

function toSafeErrorMessage(error: unknown, fallbackMessage: string) {
  if (!(error instanceof Error)) {
    return fallbackMessage
  }

  const message = error.message

  if (message.includes("No module named 'spacy'") || message.includes("Install spaCy")) {
    return "SciSpaCy runtime is not installed. Using rule-based fallback extraction."
  }

  if (message.includes("No module named 'scispacy'")) {
    return "SciSpaCy package is not installed. Using rule-based fallback extraction."
  }

  if (message.includes("Install the SciSpaCy model")) {
    return "SciSpaCy model is missing. Using rule-based fallback extraction."
  }

  if (message.includes("linker") && message.includes("could not be loaded")) {
    return "Selected linker resources are unavailable. Using rule-based fallback extraction."
  }

  if (message.includes("timed out")) {
    return "SciSpaCy request timed out. Using rule-based fallback extraction."
  }

  return "SciSpaCy is currently unavailable. Using rule-based fallback extraction."
}

async function runSciSpacy(
  text: string,
  options: {
    modelName?: string
    linkerName?: string
  },
) {
  const allowedLinkers = new Set(["", "mesh", "rxnorm", "umls", "go", "hpo"])
  const pythonExecutable = process.env.SCISPACY_PYTHON || process.env.BIOSENTVEC_PYTHON || getWorkspacePython()
  const modelName = options.modelName || process.env.SCISPACY_MODEL || "en_core_sci_sm"
  const requestedLinker = options.linkerName || process.env.SCISPACY_LINKER_NAME || ""
  const linkerName = allowedLinkers.has(requestedLinker) ? requestedLinker : ""
  const bridgeScript = path.join(process.cwd(), "scripts", "scispacy_bridge.py")
  const payload = JSON.stringify({ text, modelName, linkerName })
  const stdout = await runBridgeProcess(pythonExecutable, bridgeScript, payload)

  return JSON.parse(stdout)
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
      reject(new Error("SciSpaCy bridge timed out after 30 seconds."))
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
        reject(new Error(stderr.trim() || `SciSpaCy bridge exited with code ${code}.`))
        return
      }

      resolve(stdout)
    })

    child.stdin.write(payload)
    child.stdin.end()
  })
}