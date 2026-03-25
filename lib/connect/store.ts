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
const CONNECT_CACHE_TTL_MS = 30_000

const SESSION_DURATION_OPTIONS = [20, 40, 60] as const

let connectCache: { data: ConnectDataStore; cachedAt: number } | null = null

const STANDARD_SESSION_PRICES = {
  chat: 199,
  audio: 299,
  video: 499,
} as const

const INDIAN_MENTOR_NAME_BY_ID: Record<string, string> = {
  "mentor-lymphoma-aanya": "Aanya Sharma",
  "mentor-crohns-rafael": "Rohan Mehta",
  "mentor-breastcancer-noor": "Noor Fatima",
  "mentor-hypertension-liam": "Liam Kapoor",
  "mentor-asthma-priya": "Priya Nair",
  "mentor-migraine-zoe": "Zoya Malhotra",
  "mentor-viralfever-omar": "Omar Siddiqui",
  "mentor-cancer-david": "Devansh Khanna",
  "mentor-diabetes-elena": "Esha Verma",
  "mentor-diarrhea-sana": "Sana Farooq",
  "mentor-cancer-lakshya": "Lakshya Vashishta",
}

function getStandardSessionPrices() {
  return [
    { sessionType: "chat" as const, durationMinutes: 20 as const, priceUsd: STANDARD_SESSION_PRICES.chat },
    { sessionType: "audio" as const, durationMinutes: 40 as const, priceUsd: STANDARD_SESSION_PRICES.audio },
    { sessionType: "video" as const, durationMinutes: 60 as const, priceUsd: STANDARD_SESSION_PRICES.video },
  ]
}

function normalizeMentorProfile(mentor: MentorProfile): MentorProfile {
  const normalizedName = INDIAN_MENTOR_NAME_BY_ID[mentor.id] ?? mentor.name

  return {
    ...mentor,
    name: normalizedName,
    country: "India",
    language: mentor.language?.includes("Hindi") ? mentor.language : "English, Hindi",
    email:
      mentor.id === "mentor-cancer-lakshya"
        ? "shuklanaman9079@gmail.com"
        : mentor.email && mentor.email.trim().length > 0
          ? mentor.email
          : `${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}@medisyn-connect.com`,
    diseaseRecoveredFrom: normalizeDiseaseCategory(mentor.diseaseRecoveredFrom),
    sessionPrices: getStandardSessionPrices(),
  }
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeDiseaseCategory(value: string) {
  const text = value.trim().toLowerCase()

  if (text.includes("diabet")) {
    return "Diabetes"
  }
  if (text.includes("diarr") || text.includes("crohn") || text.includes("colitis") || text.includes("ibs")) {
    return "Diarrhea"
  }
  if (text.includes("cancer") || text.includes("lymphoma")) {
    return "Cancer"
  }
  if (text.includes("hypertension") || text.includes("blood pressure")) {
    return "Hypertension"
  }
  if (text.includes("asthma")) {
    return "Asthma"
  }
  if (text.includes("migraine")) {
    return "Migraine"
  }
  if (text.includes("viral") || text.includes("fever")) {
    return "Viral Fever"
  }

  return value
}

function getDefaultConnectData(): ConnectDataStore {
  const now = nowIso()

  return {
    mentors: [
      {
        id: "mentor-lymphoma-aanya",
        name: "Aanya Sharma",
        email: "aanya.sharma@medisyn-connect.com",
        avatarSeed: "aanya-sharma",
        diseaseRecoveredFrom: "Cancer",
        treatmentUsed: "Chemotherapy + supportive nutrition",
        recoveryDuration: "11 months",
        experienceSummary:
          "I completed six cycles of treatment and learned practical routines for managing fatigue, appetite loss, and anxiety during and after chemo.",
        verified: true,
        language: "English, Hindi",
        country: "India",
        yearsSinceRecovery: 3,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 84,
        averageRating: 4.8,
        reviewCount: 26,
      },
      {
        id: "mentor-crohns-rafael",
        name: "Rafael Mendes",
        email: "rafael.mendes@medisyn-connect.com",
        avatarSeed: "rafael-mendes",
        diseaseRecoveredFrom: "Diabetes",
        treatmentUsed: "Medication + food planning + exercise routine",
        recoveryDuration: "18 months",
        experienceSummary:
          "I went from unstable sugar levels to consistent control and can share practical habits for meals, activity, and medication consistency.",
        verified: true,
        language: "English, Portuguese",
        country: "Brazil",
        yearsSinceRecovery: 4,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 61,
        averageRating: 4.7,
        reviewCount: 18,
      },
      {
        id: "mentor-breastcancer-noor",
        name: "Noor Al-Hassan",
        email: "noor.alhassan@medisyn-connect.com",
        avatarSeed: "noor-alhassan",
        diseaseRecoveredFrom: "Diarrhea",
        treatmentUsed: "Hydration strategy + gut-friendly diet + follow-up care",
        recoveryDuration: "14 months",
        experienceSummary:
          "I focus on restoring gut stability, hydration, and confidence after prolonged digestive issues and recurring loose stools.",
        verified: true,
        language: "English, Arabic",
        country: "UAE",
        yearsSinceRecovery: 5,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 104,
        averageRating: 4.9,
        reviewCount: 40,
      },
      {
        id: "mentor-hypertension-liam",
        name: "Liam Carter",
        email: "liam.carter@medisyn-connect.com",
        avatarSeed: "liam-carter",
        diseaseRecoveredFrom: "Hypertension",
        treatmentUsed: "Medication adherence + sodium control + daily walking",
        recoveryDuration: "9 months",
        experienceSummary:
          "I can share practical blood-pressure tracking routines and sustainable lifestyle adjustments that worked long term.",
        verified: true,
        language: "English",
        country: "USA",
        yearsSinceRecovery: 2,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 47,
        averageRating: 4.6,
        reviewCount: 15,
      },
      {
        id: "mentor-asthma-priya",
        name: "Priya Nair",
        email: "priya.nair@medisyn-connect.com",
        avatarSeed: "priya-nair",
        diseaseRecoveredFrom: "Asthma",
        treatmentUsed: "Inhaler discipline + trigger tracking + breathing routines",
        recoveryDuration: "10 months",
        experienceSummary:
          "I help patients build routines to reduce flare-ups and handle daily life with better breathing confidence.",
        verified: true,
        language: "English, Hindi",
        country: "India",
        yearsSinceRecovery: 3,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 58,
        averageRating: 4.7,
        reviewCount: 19,
      },
      {
        id: "mentor-migraine-zoe",
        name: "Zoe Martin",
        email: "zoe.martin@medisyn-connect.com",
        avatarSeed: "zoe-martin",
        diseaseRecoveredFrom: "Migraine",
        treatmentUsed: "Trigger tracking + medication timing + hydration routine",
        recoveryDuration: "8 months",
        experienceSummary:
          "I can share practical steps that helped reduce migraine frequency and improve daily functioning.",
        verified: true,
        language: "English",
        country: "UK",
        yearsSinceRecovery: 2,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 53,
        averageRating: 4.7,
        reviewCount: 17,
      },
      {
        id: "mentor-viralfever-omar",
        name: "Omar Siddiqui",
        email: "omar.siddiqui@medisyn-connect.com",
        avatarSeed: "omar-siddiqui",
        diseaseRecoveredFrom: "Viral Fever",
        treatmentUsed: "Rest protocol + hydration + monitored recovery",
        recoveryDuration: "6 weeks",
        experienceSummary:
          "I help patients manage post-viral fatigue, hydration habits, and safe return-to-work routines.",
        verified: true,
        language: "English, Urdu",
        country: "Pakistan",
        yearsSinceRecovery: 2,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 36,
        averageRating: 4.6,
        reviewCount: 12,
      },
      {
        id: "mentor-cancer-david",
        name: "David Kim",
        email: "david.kim@medisyn-connect.com",
        avatarSeed: "david-kim",
        diseaseRecoveredFrom: "Cancer",
        treatmentUsed: "Surgery + chemo support plan + nutrition",
        recoveryDuration: "13 months",
        experienceSummary:
          "I can share practical coping routines for treatment cycles, energy management, and family communication.",
        verified: true,
        language: "English, Korean",
        country: "South Korea",
        yearsSinceRecovery: 4,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 79,
        averageRating: 4.8,
        reviewCount: 24,
      },
      {
        id: "mentor-diabetes-elena",
        name: "Elena Petrova",
        email: "elena.petrova@medisyn-connect.com",
        avatarSeed: "elena-petrova",
        diseaseRecoveredFrom: "Diabetes",
        treatmentUsed: "Continuous glucose monitoring + meal planning",
        recoveryDuration: "12 months",
        experienceSummary:
          "I guide patients on glucose monitoring discipline and practical day-to-day meal adjustments.",
        verified: true,
        language: "English, Russian",
        country: "Bulgaria",
        yearsSinceRecovery: 3,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 66,
        averageRating: 4.7,
        reviewCount: 22,
      },
      {
        id: "mentor-diarrhea-sana",
        name: "Sana Farooq",
        email: "sana.farooq@medisyn-connect.com",
        avatarSeed: "sana-farooq",
        diseaseRecoveredFrom: "Diarrhea",
        treatmentUsed: "Diet reset + hydration + follow-up testing",
        recoveryDuration: "4 months",
        experienceSummary:
          "I can help patients with practical routines for hydration, diet reintroduction, and symptom tracking.",
        verified: true,
        language: "English, Hindi",
        country: "India",
        yearsSinceRecovery: 2,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 42,
        averageRating: 4.6,
        reviewCount: 14,
      },
      {
        id: "mentor-cancer-lakshya",
        name: "Lakshya Vashishta",
        email: "shuklanaman9079@gmail.com",
        avatarSeed: "lakshya-vashishta",
        diseaseRecoveredFrom: "Cancer",
        treatmentUsed: "Chemo cycle planning + nutrition support + recovery routines",
        recoveryDuration: "12 months",
        experienceSummary:
          "I support patients with practical guidance on managing treatment routines, fatigue windows, and confidence during recovery.",
        verified: true,
        language: "English, Hindi",
        country: "India",
        yearsSinceRecovery: 2,
        disclaimer: "Mentor shares personal recovery experience only and does not provide medical advice.",
        sessionPrices: getStandardSessionPrices(),
        totalSessions: 31,
        averageRating: 4.8,
        reviewCount: 11,
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
        monthlyUsd: 49,
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

function setConnectCache(data: ConnectDataStore) {
  connectCache = {
    data,
    cachedAt: Date.now(),
  }
}

export async function loadConnectData() {
  if (connectCache && Date.now() - connectCache.cachedAt < CONNECT_CACHE_TTL_MS) {
    return connectCache.data
  }

  try {
    const text = await readFile(CONNECT_FILE, "utf8")
    const parsed = JSON.parse(text) as ConnectDataStore

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.mentors) || !parsed.config?.proPlan) {
      throw new Error("Invalid Medisyn Connect data shape")
    }

    const defaultMentors = getDefaultConnectData().mentors
    const existingIds = new Set(parsed.mentors.map((mentor) => mentor.id))
    const missingMentors = defaultMentors.filter((mentor) => !existingIds.has(mentor.id))
    let shouldPersist = false

    if (missingMentors.length > 0) {
      parsed.mentors = [...parsed.mentors, ...missingMentors]
      shouldPersist = true
    }

    const normalizedMentors = parsed.mentors.map(normalizeMentorProfile)
    if (JSON.stringify(normalizedMentors) !== JSON.stringify(parsed.mentors)) {
      shouldPersist = true
    }
    parsed.mentors = normalizedMentors

    const normalizedConfig = {
      ...parsed.config,
      proPlan: {
        ...parsed.config.proPlan,
        planName: "Medisyn Pro",
        monthlyUsd: 49,
      },
    }
    if (JSON.stringify(normalizedConfig) !== JSON.stringify(parsed.config)) {
      shouldPersist = true
    }
    parsed.config = normalizedConfig

    if (shouldPersist) {
      await ensureFile({
        ...parsed,
        updatedAt: nowIso(),
      })
    }

    setConnectCache(parsed)

    return parsed
  } catch {
    const fallback = getDefaultConnectData()
    const normalizedFallback: ConnectDataStore = {
      ...fallback,
      mentors: fallback.mentors.map(normalizeMentorProfile),
      updatedAt: nowIso(),
    }
    await ensureFile(normalizedFallback)
    setConnectCache(normalizedFallback)
    return normalizedFallback
  }
}

async function saveConnectData(data: ConnectDataStore) {
  const payload: ConnectDataStore = {
    ...data,
    updatedAt: nowIso(),
  }

  await ensureFile(payload)
  setConnectCache(payload)
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

function resolveSessionPrice(sessionType: SessionType, durationMinutes: number) {
  return getStandardSessionPrices().find(
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

  const pricing = resolveSessionPrice(input.sessionType, input.durationMinutes)
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
    patientPhone: input.patientPhone?.trim() || undefined,
    disease: input.disease.trim(),
    sessionType: input.sessionType,
    durationMinutes: input.durationMinutes,
    scheduledAt: scheduledAt.toISOString(),
    amountUsd,
    platformCommissionUsd,
    mentorPayoutUsd,
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
