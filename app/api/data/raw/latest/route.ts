import path from "node:path"
import { readFile } from "node:fs/promises"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const latestFile = path.join(process.cwd(), "data", "raw", "latest.json")

  try {
    const content = await readFile(latestFile, "utf8")
    const parsed = JSON.parse(content) as unknown
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No collected raw data found. Run POST /api/data/collect first.",
      },
      { status: 404 },
    )
  }
}
