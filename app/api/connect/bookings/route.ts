import { NextRequest, NextResponse } from "next/server"
import { createBooking, listBookings } from "@/lib/connect/store"
import { sendBookingConfirmationEmails } from "@/lib/connect/email"
import type { BookingCreateInput, SessionDuration, SessionType } from "@/lib/connect/types"

export const runtime = "nodejs"

function parseSessionType(value: unknown): SessionType | null {
  return value === "chat" || value === "audio" || value === "video" ? value : null
}

function parseSessionDuration(value: unknown): SessionDuration | null {
  return value === 20 || value === 40 || value === 60 ? value : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get("limit") ?? "30")
    const bookings = await listBookings(Number.isFinite(limitParam) ? limitParam : 30)

    return NextResponse.json({ ok: true, bookings })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load bookings",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Partial<BookingCreateInput> | null

    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 })
    }

    const sessionType = parseSessionType(body.sessionType)
    const durationMinutes = parseSessionDuration(body.durationMinutes)

    if (!body.mentorId || !sessionType || !durationMinutes) {
      return NextResponse.json(
        {
          ok: false,
          error: "mentorId, sessionType, and durationMinutes are required",
        },
        { status: 400 },
      )
    }

    const bookingResult = await createBooking({
      mentorId: body.mentorId,
      patientName: String(body.patientName ?? ""),
      patientEmail: String(body.patientEmail ?? ""),
      disease: String(body.disease ?? ""),
      sessionType,
      durationMinutes,
      scheduledAt: String(body.scheduledAt ?? ""),
    })

    let emailDelivery: { sent: boolean; message: string } = {
      sent: true,
      message: "Booking confirmation emails sent to patient and mentor.",
    }

    try {
      await sendBookingConfirmationEmails({
        booking: bookingResult.booking,
        mentor: bookingResult.mentor,
      })
    } catch (error) {
      emailDelivery = {
        sent: false,
        message: error instanceof Error ? error.message : "Email delivery failed",
      }
    }

    return NextResponse.json({ ok: true, ...bookingResult, emailDelivery }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 400 },
    )
  }
}
