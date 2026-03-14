const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatCard {
  title: string
  value: string
  change: string
  description: string
  color: string
}

export interface SideEffectBar {
  name: string
  value: number
}

export interface RecoveryPoint {
  week: string
  patients: number
  recovered: number
}

export interface SentimentPoint {
  month: string
  positive: number
  neutral: number
  negative: number
}

export interface RecentTreatment {
  name: string
  condition: string
  sentiment: "positive" | "neutral" | "negative"
  analyses: number
  trend: "up" | "stable" | "down"
}

export interface DashboardStats {
  stats: StatCard[]
  side_effects: SideEffectBar[]
  recovery_data: RecoveryPoint[]
  sentiment_data: SentimentPoint[]
  recent_treatments: RecentTreatment[]
}

export interface TreatmentSummary {
  id: number
  name: string
  condition: string
  patients: number
  rating: number
}

export interface SideEffect {
  name: string
  percentage: number
  severity: "mild" | "moderate" | "severe"
}

export interface SentimentSlice {
  name: string
  value: number
  fill: string
}

export interface RecoveryMilestone {
  week: string
  percentage: number
  milestone: string
}

export interface TreatmentDetail {
  id: number
  name: string
  condition: string
  total_patients: number
  avg_recovery_weeks: number
  positive_rate: number
  analyses: number
  side_effects: SideEffect[]
  sentiment_breakdown: SentimentSlice[]
  recovery_timeline: RecoveryMilestone[]
}

export interface InsightStat {
  label: string
  value: string
  change: string
}

export interface Insight {
  id: number
  type: "discovery" | "alert" | "trend"
  title: string
  summary: string
  details: string
  treatment: string
  condition: string
  confidence: number
  impact: "high" | "medium" | "low"
  date: string
  data_points: number
  actionable: boolean
}

export interface Experience {
  id: number
  author: string
  initials: string
  treatment: string
  condition: string
  date: string
  content: string
  tags: string[]
  sentiment: "positive" | "neutral" | "negative"
  credibility_score: number
  likes: number
  replies: number
  verified: boolean
}

export interface UserStat {
  label: string
  value: string
  trend: string
}

export interface ActivityItem {
  action: string
  target: string
  time: string
  type: string
}

export interface UserProfile {
  name: string
  role: string
  organization: string
  location: string
  member_since: string
  plan: string
  avatar_seed: string
  stats: UserStat[]
  recent_activity: ActivityItem[]
}

// ── API functions ─────────────────────────────────────────────────────────────

export const api = {
  // Dashboard
  getDashboard: () =>
    apiFetch<DashboardStats>("/api/dashboard"),

  // Treatments
  listTreatments: (params?: { search?: string; condition?: string; sort_by?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return apiFetch<TreatmentSummary[]>(`/api/treatments${q ? `?${q}` : ""}`)
  },
  getTreatment: (id: number) =>
    apiFetch<TreatmentDetail>(`/api/treatments/${id}`),

  // AI Insights
  getInsightStats: () =>
    apiFetch<InsightStat[]>("/api/insights/stats"),
  listInsights: (type?: string) =>
    apiFetch<Insight[]>(`/api/insights${type && type !== "all" ? `?type=${type}` : ""}`),
  getInsight: (id: number) =>
    apiFetch<Insight>(`/api/insights/${id}`),

  // Patient Experiences
  listExperiences: (params?: { search?: string; tag?: string; sort_by?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return apiFetch<Experience[]>(`/api/experiences${q ? `?${q}` : ""}`)
  },
  likeExperience: (id: number) =>
    apiFetch<Experience>(`/api/experiences/${id}/like`, { method: "POST" }),

  // Profile
  getProfile: () =>
    apiFetch<UserProfile>("/api/profile"),
}
