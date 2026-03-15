import { NextResponse } from "next/server"
import { getConnectPlans } from "@/lib/connect/store"

export const runtime = "nodejs"

export async function GET() {
  try {
    const config = await getConnectPlans()

    return NextResponse.json({
      ok: true,
      config,
      pricingExamples: [
        { label: "20-minute chat", amountUsd: 10 },
        { label: "40-minute audio call", amountUsd: 20 },
        { label: "60-minute video call", amountUsd: 30 },
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load plans",
      },
      { status: 500 },
    )
  }
}
