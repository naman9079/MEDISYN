import { NextRequest, NextResponse } from "next/server"
import { loadProfileSettings, updateProfileSettings } from "@/lib/profile/store"
import type { ProfileUpdatePayload } from "@/lib/profile/types"

export const runtime = "nodejs"

export async function GET() {
  try {
    const profile = await loadProfileSettings()
    return NextResponse.json({ ok: true, profile })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load profile settings",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as ProfileUpdatePayload | null

    if (!body || !body.updates || typeof body.updates !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid payload. 'updates' is required." }, { status: 400 })
    }

    const profile = await updateProfileSettings(body)

    return NextResponse.json({ ok: true, profile })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update profile settings",
      },
      { status: 500 },
    )
  }
}
