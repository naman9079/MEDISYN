import { NextRequest, NextResponse } from "next/server"
import type { SessionType } from "@/lib/connect/types"
import { listMentors } from "@/lib/connect/store"

export const runtime = "nodejs"

function parseSessionType(value: string | null): SessionType | undefined {
  if (value === "chat" || value === "audio" || value === "video") {
    return value
  }

  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const disease = searchParams.get("disease") ?? undefined
    const query = searchParams.get("q") ?? undefined
    const sessionType = parseSessionType(searchParams.get("sessionType"))

    const payload = await listMentors({
      disease,
      query,
      sessionType,
    })

    return NextResponse.json({ ok: true, ...payload })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load mentors",
      },
      { status: 500 },
    )
  }
}
