import path from "node:path"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import type { ProfileActivity, ProfileSettings, ProfileUpdatePayload } from "@/lib/profile/types"

const PROFILE_FILE = path.join(process.cwd(), "data", "real", "profile-settings.json")

function nowIso() {
  return new Date().toISOString()
}

function getDefaultProfile(): ProfileSettings {
  const now = nowIso()

  return {
    profile: {
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@medisyn.ai",
      role: "Healthcare Data Analyst",
      organization: "Stanford Medical Center",
      location: "San Francisco, CA",
      memberSince: "2024-01-01",
      avatarSeed: "medisyn",
    },
    notifications: {
      aiInsightAlerts: true,
      treatmentUpdates: true,
      weeklyDigest: false,
      securityAlerts: true,
    },
    security: {
      twoFactorEnabled: true,
      passwordUpdatedAt: "2026-02-13T00:00:00.000Z",
    },
    subscription: {
      plan: "pro",
      status: "active",
      billingPeriod: "monthly",
      nextBillingDate: "2026-04-15",
      amount: 49,
      currency: "INR",
      autoRenew: true,
    },
    stats: {
      analysesRun: 1847,
      insightsGenerated: 423,
      hoursSaved: 156,
      accuracyScore: 94.2,
    },
    recentActivity: [
      {
        id: randomUUID(),
        action: "Analyzed treatment",
        target: "Custom treatment analysis",
        time: now,
        type: "analysis",
      },
      {
        id: randomUUID(),
        action: "Generated insight",
        target: "Drug interaction warning",
        time: now,
        type: "insight",
      },
      {
        id: randomUUID(),
        action: "Reviewed report",
        target: "Q4 Patient Outcomes",
        time: now,
        type: "report",
      },
    ],
    updatedAt: now,
  }
}

async function ensureFile(profile: ProfileSettings) {
  await mkdir(path.dirname(PROFILE_FILE), { recursive: true })
  await writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), "utf8")
}

export async function loadProfileSettings() {
  try {
    const text = await readFile(PROFILE_FILE, "utf8")
    const parsed = JSON.parse(text) as ProfileSettings

    if (!parsed || typeof parsed !== "object" || !parsed.profile || !parsed.subscription) {
      throw new Error("Invalid profile settings shape")
    }

    const normalized: ProfileSettings = {
      ...parsed,
      subscription: {
        ...parsed.subscription,
        currency: "INR",
      },
    }

    if (normalized.subscription.currency !== parsed.subscription.currency) {
      await ensureFile(normalized)
    }

    return normalized
  } catch {
    const defaultProfile = getDefaultProfile()
    await ensureFile(defaultProfile)
    return defaultProfile
  }
}

export async function saveProfileSettings(profile: ProfileSettings) {
  await ensureFile(profile)
  return profile
}

function mergeProfileSettings(current: ProfileSettings, updates: Partial<ProfileSettings>) {
  return {
    ...current,
    ...updates,
    profile: {
      ...current.profile,
      ...(updates.profile ?? {}),
    },
    notifications: {
      ...current.notifications,
      ...(updates.notifications ?? {}),
    },
    security: {
      ...current.security,
      ...(updates.security ?? {}),
    },
    subscription: {
      ...current.subscription,
      ...(updates.subscription ?? {}),
    },
    stats: {
      ...current.stats,
      ...(updates.stats ?? {}),
    },
  }
}

export async function updateProfileSettings(payload: ProfileUpdatePayload) {
  const current = await loadProfileSettings()
  const merged = mergeProfileSettings(current, payload.updates)

  const updatedActivity: ProfileActivity[] = payload.activity
    ? [
        {
          id: randomUUID(),
          action: payload.activity.action,
          target: payload.activity.target,
          type: payload.activity.type,
          time: nowIso(),
        },
        ...merged.recentActivity,
      ].slice(0, 20)
    : merged.recentActivity

  const finalProfile: ProfileSettings = {
    ...merged,
    recentActivity: updatedActivity,
    updatedAt: nowIso(),
  }

  await saveProfileSettings(finalProfile)
  return finalProfile
}
