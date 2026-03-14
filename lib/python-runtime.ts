import fs from "node:fs"
import path from "node:path"

export function getWorkspacePython(fallback = "python") {
  const windowsPython = path.join(process.cwd(), ".venv", "Scripts", "python.exe")
  const unixPython = path.join(process.cwd(), ".venv", "bin", "python")

  if (fs.existsSync(windowsPython)) {
    return windowsPython
  }

  if (fs.existsSync(unixPython)) {
    return unixPython
  }

  return fallback
}