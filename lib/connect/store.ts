import path from "node:path"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import type {
  BookingCreateInput,
  ConnectDataStore,
  MentorBooking,
  MentorFilter,
  MentorProfile,
  MentorReview,
  ReviewCreateInput,
  SessionType,
} from "@/lib/connect/types"

const CONNECT_FILE = path.join(process.cwd(), "data", "real", "connect-marketplace.json")

const SESSION_DURATION_OPTIONS = [20, 40, 60] as const

function nowIso() {
  return new Date().toISOString()
}

function getDefaultConnectData(): ConnectDataStore {
  const now = nowIso()

  return {
    mentors: [
      {
        id: "mentor-lymphoma-aanya",
        name: "Aanya Sharma",
        avatarSeed: "aanya-sharma",
        diseaseRecoveredFrom: "Hodgkin Lymphoma",
        treatmentUsed: "ABVD chemotherapy + supportive nutrition",
        recoveryDuration: "11 months",
        experienceSummary:
          "I completed six cycles of treatment and learned practical routines for managing fatigue, appetite loss, and anxiety during and after chemo.",
        verified: true,
        language: "English, Hindi",
        country: "India",
        yearsSinceRecovery: 3,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: [
          { sessionType: "chat", durationMinutes: 20, priceUsd: 10 },
          { sessionType: "audio", durationMinutes: 40, priceUsd: 20 },
          { sessionType: "video", durationMinutes: 60, priceUsd: 30 },
        ],
        totalSessions: 84,
        averageRating: 4.8,
        reviewCount: 26,
      },
      {
        id: "mentor-crohns-rafael",
        name: "Rafael Mendes",
        avatarSeed: "rafael-mendes",
        diseaseRecoveredFrom: "Crohn's Disease",
        treatmentUsed: "Biologics + elimination diet + stress management",
        recoveryDuration: "18 months",
        experienceSummary:
          "I went from frequent flare-ups to stable remission. I can share practical recovery timelines, food triggers, and emotional coping routines.",
        verified: true,
        language: "English, Portuguese",
        country: "Brazil",
        yearsSinceRecovery: 4,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: [
          { sessionType: "chat", durationMinutes: 20, priceUsd: 12 },
          { sessionType: "audio", durationMinutes: 40, priceUsd: 22 },
          { sessionType: "video", durationMinutes: 60, priceUsd: 34 },
        ],
        totalSessions: 61,
        averageRating: 4.7,
        reviewCount: 18,
      },
      {
        id: "mentor-breastcancer-noor",
        name: "Noor Al-Hassan",
        avatarSeed: "noor-alhassan",
        diseaseRecoveredFrom: "Breast Cancer",
        treatmentUsed: "Surgery + adjuvant chemotherapy + hormone therapy",
        recoveryDuration: "14 months",
        experienceSummary:
          "I focus on post-surgery routines, hair-loss confidence, work reintegration, and handling uncertainty with family support.",
        verified: true,
        language: "English, Arabic",
        country: "UAE",
        yearsSinceRecovery: 5,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: [
          { sessionType: "chat", durationMinutes: 20, priceUsd: 11 },
          { sessionType: "audio", durationMinutes: 40, priceUsd: 21 },
          { sessionType: "video", durationMinutes: 60, priceUsd: 32 },
        ],
        totalSessions: 104,
        averageRating: 4.9,
        reviewCount: 40,
      },
    ],
    reviews: [
      {
        id: randomUUID(),
        mentorId: "mentor-lymphoma-aanya",
        patientName: "Maya R.",
        rating: 5,
        comment: "Very practical session. Helped me understand chemo-day planning and emotional ups and downs.",
        createdAt: now,
      },
      {
        id: randomUUID(),
        mentorId: "mentor-crohns-rafael",
        patientName: "John K.",
        rating: 4,
        comment: "Clear explanation of his remission timeline and daily routines.",
        createdAt: now,
      },
    ],
    bookings: [],
    config: {
      proPlan: {
        planName: "Medisyn Pro",
        monthlyUsd: 9,
        benefits: ["Unlimited mentor browsing", "Discounted session pricing", "Priority mentor matching"],
      },
      platformCommissionRate: 0.2,
    },
    updatedAt: now,
  }
}

async function ensureFile(data: ConnectDataStore) {
  await mkdir(path.dirname(CONNECT_FILE), { recursive: true })
  await writeFile(CONNECT_FILE, JSON.stringify(data, null, 2), "utf8")
}

export async function loadConnectData() {
  try {
    const text = await readFile(CONNECT_FILE, "utf8")
    const parsed = JSON.parse(text) as ConnectDataStore

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.mentors) || !parsed.config?.proPlan) {
      throw new Error("Invalid Medisyn Connect data shape")
    }

    return parsed
  } catch {
    const fallback = getDefaultConnectData()
    await ensureFile(fallback)
    return fallback
  }
}

async function saveConnectData(data: ConnectDataStore) {
  const payload: ConnectDataStore = {
    ...data,
    updatedAt: nowIso(),
  }

  await ensureFile(payload)
  return payload
}

function parseDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function calculateMentorStats(mentor: MentorProfile, reviews: MentorReview[]) {
  const mentorReviews = reviews.filter((review) => review.mentorId === mentor.id)
  if (mentorReviews.length === 0) {
    return mentor
  }

  const total = mentorReviews.reduce((sum, review) => sum + review.rating, 0)
  return {
    ...mentor,
    averageRating: Number((total / mentorReviews.length).toFixed(1)),
    reviewCount: mentorReviews.length,
  }
}

export async function listMentors(filters: MentorFilter = {}) {
  const data = await loadConnectData()

  const disease = filters.disease ? normalize(filters.disease) : ""
  const query = filters.query ? normalize(filters.query) : ""

  const filtered = data.mentors
    .filter((mentor) => {
      const matchesDisease = disease.length === 0 || normalize(mentor.diseaseRecoveredFrom).includes(disease)
      const matchesQuery =
        query.length === 0 ||
        normalize(mentor.name).includes(query) ||
        normalize(mentor.experienceSummary).includes(query) ||
        normalize(mentor.treatmentUsed).includes(query)
      const matchesSessionType =
        !filters.sessionType || mentor.sessionPrices.some((price) => price.sessionType === filters.sessionType)

      return matchesDisease && matchesQuery && matchesSessionType
    })
    .map((mentor) => calculateMentorStats(mentor, data.reviews))
    .sort((left, right) => right.averageRating - left.averageRating)

  return {
    mentors: filtered,
    meta: {
      totalMentors: filtered.length,
      platformCommissionRate: data.config.platformCommissionRate,
      proPlan: data.config.proPlan,
      medicalDisclaimer: "Mentors share personal recovery experiences only. No medical advice is provided.",
    },
  }
}

function resolveSessionPrice(mentor: MentorProfile, sessionType: SessionType, durationMinutes: number) {
  return mentor.sessionPrices.find(
    (price) => price.sessionType === sessionType && price.durationMinutes === durationMinutes,
  )
}

export async function createBooking(input: BookingCreateInput) {
  const data = await loadConnectData()

  const mentor = data.mentors.find((item) => item.id === input.mentorId)
  if (!mentor) {
    throw new Error("Mentor not found")
  }

  if (!input.patientName.trim() || !input.patientEmail.trim() || !input.disease.trim()) {
    throw new Error("Patient name, email, and disease are required")
  }

  if (!SESSION_DURATION_OPTIONS.includes(input.durationMinutes)) {
    throw new Error("Invalid session duration")
  }

  const scheduledAt = parseDate(input.scheduledAt)
  if (!scheduledAt) {
    throw new Error("Invalid scheduled date")
  }

  if (scheduledAt.getTime() < Date.now()) {
    throw new Error("Session must be booked for a future time")
  }

  const pricing = resolveSessionPrice(mentor, input.sessionType, input.durationMinutes)
  if (!pricing) {
    throw new Error("Selected mentor does not offer this session type and duration")
  }

  const amountUsd = pricing.priceUsd
  const platformCommissionUsd = Number((amountUsd * data.config.platformCommissionRate).toFixed(2))
  const mentorPayoutUsd = Number((amountUsd - platformCommissionUsd).toFixed(2))

  const booking: MentorBooking = {
    id: randomUUID(),
    mentorId: mentor.id,
    patientName: input.patientName.trim(),
    patientEmail: input.patientEmail.trim(),
    disease: input.disease.trim(),
    sessionType: input.sessionType,
    durationMinutes: input.durationMinutes,
    scheduledAt: scheduledAt.toISOString(),
    amountUsd,
    platformCommissionUsd,
    mentorPayoutUsd,
    paymentProvider: input.paymentProvider,
    paymentStatus: "paid",
    status: "scheduled",
    createdAt: nowIso(),
  }

  const nextData: ConnectDataStore = {
    ...data,
    bookings: [booking, ...data.bookings],
  }

  await saveConnectData(nextData)

  return {
    booking,
    mentor,
    checkout: {
      provider: input.paymentProvider,
      status: "simulated-success",
      message: "Payment simulation complete. Replace with Stripe/Razorpay checkout session in production.",
    },
  }
}

export async function listBookings(limit = 30) {
  const data = await loadConnectData()
  return data.bookings.slice(0, Math.max(1, Math.min(limit, 100)))
}

export async function createReview(input: ReviewCreateInput) {
  const data = await loadConnectData()

  const mentor = data.mentors.find((item) => item.id === input.mentorId)
  if (!mentor) {
    throw new Error("Mentor not found")
  }

  const trimmedComment = input.comment.trim()
  const trimmedPatientName = input.patientName.trim()

  if (!trimmedPatientName) {
    throw new Error("Patient name is required")
  }

  if (!trimmedComment) {
    throw new Error("Review comment is required")
  }

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)))

  const review: MentorReview = {
    id: randomUUID(),
    mentorId: mentor.id,
    patientName: trimmedPatientName,
    rating,
    comment: trimmedComment,
    createdAt: nowIso(),
  }

  const nextData: ConnectDataStore = {
    ...data,
    reviews: [review, ...data.reviews],
  }

  await saveConnectData(nextData)

  return review
}

export async function listReviews(mentorId?: string, limit = 60) {
  const data = await loadConnectData()

  const filtered = mentorId
    ? data.reviews.filter((review) => review.mentorId === mentorId)
    : data.reviews

  return filtered.slice(0, Math.max(1, Math.min(limit, 120)))
}

export async function getConnectPlans() {
  const data = await loadConnectData()
  return data.config
}
