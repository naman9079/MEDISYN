import { NextRequest, NextResponse } from "next/server"
import { getDbHealth, getRecentRawDiscussions } from "@/lib/data-collection/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestedLimit = Number(searchParams.get("limit") ?? "50")
  const sourceType = searchParams.get("sourceType") ?? undefined
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 50

  try {
    const items = await getRecentRawDiscussions(limit, sourceType)
    const health = await getDbHealth()

    return NextResponse.json({
      ok: true,
      realtime: true,
      itemCount: items.length,
      items,
      database: health,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to read realtime data",
      },
      { status: 500 },
    )
  }
}
