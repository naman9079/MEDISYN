import nodemailer from "nodemailer"
import type { MentorBooking, MentorProfile } from "@/lib/connect/types"

type BookingEmailInput = {
  booking: MentorBooking
  mentor: MentorProfile
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required email configuration: ${name}`)
  }

  return value
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getTransporter() {
  const host = requiredEnv("SMTP_HOST")
  const portRaw = requiredEnv("SMTP_PORT")
  const user = requiredEnv("SMTP_USER")
  const pass = requiredEnv("SMTP_PASS")
  const secure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true"
  const port = Number(portRaw)

  if (!Number.isFinite(port)) {
    throw new Error("SMTP_PORT must be a valid number")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export async function sendBookingConfirmationEmails({ booking, mentor }: BookingEmailInput) {
  const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "namannsh0009@gmail.com").trim()
  if (!from) {
    throw new Error("Missing required email configuration: SMTP_FROM or SMTP_USER")
  }
  const transporter = getTransporter()

  const commonLines = [
    `Mentor: ${mentor.name}`,
    `Patient: ${booking.patientName}`,
    `Disease: ${booking.disease}`,
    `Session Type: ${booking.sessionType}`,
    `Duration: ${booking.durationMinutes} minutes`,
    `Scheduled At: ${formatDate(booking.scheduledAt)}`,
    `Payment Status: ${booking.paymentStatus}`,
    `Amount: $${booking.amountUsd}`,
  ]

  const patientText = [
    `Hi ${booking.patientName},`,
    "",
    "Your mentorship session has been booked successfully.",
    "",
    ...commonLines,
    "",
    `Mentor contact: ${mentor.email}`,
    "",
    "Thank you for using Medisyn Connect.",
  ].join("\n")

  const mentorText = [
    `Hi ${mentor.name},`,
    "",
    "You have received a new mentorship booking on Medisyn Connect.",
    "",
    ...commonLines,
    "",
    `Patient contact: ${booking.patientEmail}`,
    "",
    "Please prepare for the session.",
  ].join("\n")

  await Promise.all([
    transporter.sendMail({
      from,
      to: booking.patientEmail,
      subject: `Medisyn Connect Booking Confirmed with ${mentor.name}`,
      text: patientText,
    }),
    transporter.sendMail({
      from,
      to: mentor.email,
      subject: `New Medisyn Connect Booking: ${booking.patientName}`,
      text: mentorText,
    }),
  ])
}
