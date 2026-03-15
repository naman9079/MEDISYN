export type SessionType = "chat" | "audio" | "video"

export type SessionDuration = 20 | 40 | 60

export type MentorPriceCard = {
  sessionType: SessionType
  durationMinutes: SessionDuration
  priceUsd: number
}

export type MentorReview = {
  id: string
  mentorId: string
  patientName: string
  rating: number
  comment: string
  createdAt: string
}

export type MentorProfile = {
  id: string
  name: string
  avatarSeed: string
  diseaseRecoveredFrom: string
  treatmentUsed: string
  recoveryDuration: string
  experienceSummary: string
  verified: boolean
  language: string
  country: string
  yearsSinceRecovery: number
  disclaimer: string
  sessionPrices: MentorPriceCard[]
  totalSessions: number
  averageRating: number
  reviewCount: number
}

export type MentorBooking = {
  id: string
  mentorId: string
  patientName: string
  patientEmail: string
  disease: string
  sessionType: SessionType
  durationMinutes: SessionDuration
  scheduledAt: string
  amountUsd: number
  platformCommissionUsd: number
  mentorPayoutUsd: number
  paymentProvider: "stripe" | "razorpay"
  paymentStatus: "pending" | "paid"
  status: "scheduled" | "completed" | "cancelled"
  createdAt: string
}

export type ConnectProPlan = {
  planName: string
  monthlyUsd: number
  benefits: string[]
}

export type ConnectMarketplaceConfig = {
  proPlan: ConnectProPlan
  platformCommissionRate: number
}

export type ConnectDataStore = {
  mentors: MentorProfile[]
  reviews: MentorReview[]
  bookings: MentorBooking[]
  config: ConnectMarketplaceConfig
  updatedAt: string
}

export type MentorFilter = {
  disease?: string
  query?: string
  sessionType?: SessionType
}

export type BookingCreateInput = {
  mentorId: string
  patientName: string
  patientEmail: string
  disease: string
  sessionType: SessionType
  durationMinutes: SessionDuration
  scheduledAt: string
  paymentProvider: "stripe" | "razorpay"
}

export type ReviewCreateInput = {
  mentorId: string
  patientName: string
  rating: number
  comment: string
}
