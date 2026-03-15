import { NextRequest, NextResponse } from "next/server"
import { createReview, listReviews } from "@/lib/connect/store"
import type { ReviewCreateInput } from "@/lib/connect/types"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get("mentorId") ?? undefined
    const limitParam = Number(searchParams.get("limit") ?? "60")

    const reviews = await listReviews(mentorId, Number.isFinite(limitParam) ? limitParam : 60)

    return NextResponse.json({ ok: true, reviews })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load reviews",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Partial<ReviewCreateInput> | null

    if (!body || !body.mentorId) {
      return NextResponse.json({ ok: false, error: "mentorId is required" }, { status: 400 })
    }

    const review = await createReview({
      mentorId: body.mentorId,
      patientName: String(body.patientName ?? ""),
      rating: Number(body.rating ?? 0),
      comment: String(body.comment ?? ""),
    })

    return NextResponse.json({ ok: true, review }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to add review",
      },
      { status: 400 },
    )
  }
}
