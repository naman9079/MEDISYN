export type NotificationPreferences = {
  aiInsightAlerts: boolean
  treatmentUpdates: boolean
  weeklyDigest: boolean
  securityAlerts: boolean
}

export type SecuritySettings = {
  twoFactorEnabled: boolean
  passwordUpdatedAt: string
}

export type SubscriptionStatus = "active" | "paused" | "canceled"
export type SubscriptionPlan = "free" | "pro" | "enterprise"
export type BillingPeriod = "monthly" | "yearly"

export type SubscriptionSettings = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  billingPeriod: BillingPeriod
  nextBillingDate: string
  amount: number
  currency: string
  autoRenew: boolean
}

export type ProfileStats = {
  analysesRun: number
  insightsGenerated: number
  hoursSaved: number
  accuracyScore: number
}

export type ActivityType = "analysis" | "insight" | "report" | "account" | "subscription"

export type ProfileActivity = {
  id: string
  action: string
  target: string
  time: string
  type: ActivityType
}

export type ProfileIdentity = {
  firstName: string
  lastName: string
  email: string
  role: string
  organization: string
  location: string
  memberSince: string
  avatarSeed: string
}

export type ProfileSettings = {
  profile: ProfileIdentity
  notifications: NotificationPreferences
  security: SecuritySettings
  subscription: SubscriptionSettings
  stats: ProfileStats
  recentActivity: ProfileActivity[]
  updatedAt: string
}

export type ProfileUpdatePayload = {
  updates: Partial<ProfileSettings>
  activity?: {
    action: string
    target: string
    type: ActivityType
  }
}
