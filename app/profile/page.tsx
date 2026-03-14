"use client"

import { useEffect, useMemo, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  User,
  Mail,
  Building2,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Sparkles,
  TrendingUp,
  Activity,
  Clock,
  Award,
  Zap,
  CreditCard,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react"
import type { ActivityType, ProfileActivity, ProfileSettings, SubscriptionPlan, SubscriptionStatus, BillingPeriod } from "@/lib/profile/types"

function emptyProfile(): ProfileSettings {
  const now = new Date().toISOString()

  return {
    profile: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      organization: "",
      location: "",
      memberSince: "",
      avatarSeed: "medisyn",
    },
    notifications: {
      aiInsightAlerts: false,
      treatmentUpdates: false,
      weeklyDigest: false,
      securityAlerts: false,
    },
    security: {
      twoFactorEnabled: false,
      passwordUpdatedAt: now,
    },
    subscription: {
      plan: "free",
      status: "active",
      billingPeriod: "monthly",
      nextBillingDate: "",
      amount: 0,
      currency: "USD",
      autoRenew: true,
    },
    stats: {
      analysesRun: 0,
      insightsGenerated: 0,
      hoursSaved: 0,
      accuracyScore: 0,
    },
    recentActivity: [],
    updatedAt: now,
  }
}

function formatRelativeTime(isoDate: string) {
  const value = new Date(isoDate)
  if (Number.isNaN(value.getTime())) {
    return "Recently"
  }

  const diffMs = Date.now() - value.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) {
    return "Just now"
  }
  if (minutes < 60) {
    return `${minutes} min ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`
  }

  return value.toLocaleDateString()
}

function addMonthsToDate(dateIso: string, monthsToAdd: number) {
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }

  date.setMonth(date.getMonth() + monthsToAdd)
  return date.toISOString().slice(0, 10)
}

function getPlanAmount(plan: SubscriptionPlan, billingPeriod: BillingPeriod) {
  const base = plan === "enterprise" ? 149 : plan === "pro" ? 49 : 0
  if (base === 0) {
    return 0
  }

  return billingPeriod === "yearly" ? base * 10 : base
}

function getProfileName(profile: ProfileSettings["profile"]) {
  return `${profile.firstName} ${profile.lastName}`.trim() || "Unnamed User"
}

function getActivityIconClass(type: ActivityType) {
  if (type === "analysis") {
    return "bg-primary/10"
  }
  if (type === "insight") {
    return "bg-warm/10"
  }
  if (type === "subscription") {
    return "bg-chart-4/10"
  }
  return "bg-accent/10"
}

function getActivityIcon(type: ActivityType) {
  if (type === "analysis") {
    return <Activity className="h-4 w-4 text-primary" />
  }
  if (type === "insight") {
    return <Sparkles className="h-4 w-4 text-warm" />
  }
  if (type === "subscription") {
    return <CreditCard className="h-4 w-4 text-chart-4" />
  }
  return <CheckCircle2 className="h-4 w-4 text-accent" />
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileSettings>(emptyProfile)
  const [draftProfile, setDraftProfile] = useState<ProfileSettings["profile"]>(emptyProfile().profile)
  const [draftSubscription, setDraftSubscription] = useState<ProfileSettings["subscription"]>(emptyProfile().subscription)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [statusNote, setStatusNote] = useState<string | null>(null)

  const userStats = useMemo(() => {
    return [
      { label: "Analyses Run", value: profileData.stats.analysesRun.toLocaleString(), icon: Activity, trend: "Operational activity" },
      { label: "Insights Generated", value: profileData.stats.insightsGenerated.toLocaleString(), icon: Sparkles, trend: "AI output count" },
      { label: "Hours Saved", value: profileData.stats.hoursSaved.toLocaleString(), icon: Clock, trend: "Estimated time savings" },
      { label: "Accuracy Score", value: `${profileData.stats.accuracyScore.toFixed(1)}%`, icon: Award, trend: "Based on feedback" },
    ]
  }, [profileData.stats])

  async function loadProfile() {
    setIsLoading(true)
    setStatusNote(null)

    try {
      const response = await fetch("/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load profile settings")
      }

      const payload = (await response.json()) as { profile?: ProfileSettings }

      if (!payload.profile) {
        throw new Error("Profile payload missing")
      }

      setProfileData(payload.profile)
      setDraftProfile(payload.profile.profile)
      setDraftSubscription(payload.profile.subscription)
    } catch {
      setStatusNote("Could not load profile settings right now.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  async function updateProfileSettings(
    updates: Partial<ProfileSettings>,
    activity?: { action: string; target: string; type: ActivityType },
    successNote?: string,
  ) {
    setIsSaving(true)
    setStatusNote(null)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates, activity }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const payload = (await response.json()) as { profile?: ProfileSettings }
      if (!payload.profile) {
        throw new Error("Updated profile payload missing")
      }

      setProfileData(payload.profile)
      setDraftProfile(payload.profile.profile)
      setDraftSubscription(payload.profile.subscription)
      setStatusNote(successNote ?? "Saved successfully.")
      return true
    } catch {
      setStatusNote("Could not save changes right now.")
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveAccount() {
    const success = await updateProfileSettings(
      { profile: draftProfile },
      {
        action: "Updated profile",
        target: "Account information and contact details",
        type: "account",
      },
      "Account information updated.",
    )

    if (success) {
      setIsEditing(false)
    }
  }

  async function handleSaveNotifications() {
    await updateProfileSettings(
      { notifications: profileData.notifications },
      {
        action: "Updated preferences",
        target: "Notification settings",
        type: "account",
      },
      "Notification preferences saved.",
    )
  }

  async function handleSubscriptionSave() {
    const amount = getPlanAmount(draftSubscription.plan, draftSubscription.billingPeriod)
    const nextBillingDate = addMonthsToDate(new Date().toISOString(), draftSubscription.billingPeriod === "yearly" ? 12 : 1)

    await updateProfileSettings(
      {
        subscription: {
          ...draftSubscription,
          amount,
          nextBillingDate,
        },
      },
      {
        action: "Updated subscription",
        target: `${draftSubscription.plan.toUpperCase()} plan (${draftSubscription.billingPeriod})`,
        type: "subscription",
      },
      "Subscription updated.",
    )
  }

  async function toggleSubscriptionStatus(status: SubscriptionStatus) {
    await updateProfileSettings(
      {
        subscription: {
          ...profileData.subscription,
          status,
        },
      },
      {
        action: status === "active" ? "Reactivated subscription" : status === "paused" ? "Paused subscription" : "Canceled subscription",
        target: `${profileData.subscription.plan.toUpperCase()} plan`,
        type: "subscription",
      },
      `Subscription status changed to ${status}.`,
    )
  }

  async function toggleTwoFactor(value: boolean) {
    await updateProfileSettings(
      {
        security: {
          ...profileData.security,
          twoFactorEnabled: value,
        },
      },
      {
        action: value ? "Enabled 2FA" : "Disabled 2FA",
        target: "Two-factor authentication",
        type: "account",
      },
      value ? "Two-factor authentication enabled." : "Two-factor authentication disabled.",
    )
  }

  async function simulatePasswordChange() {
    await updateProfileSettings(
      {
        security: {
          ...profileData.security,
          passwordUpdatedAt: new Date().toISOString(),
        },
      },
      {
        action: "Changed password",
        target: "Account security",
        type: "account",
      },
      "Password update timestamp refreshed.",
    )
  }

  const fullName = getProfileName(profileData.profile)
  const memberSinceText = profileData.profile.memberSince
    ? `Member since ${new Date(profileData.profile.memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
    : "Member since -"

  const statusBadgeClass =
    profileData.subscription.status === "active"
      ? "bg-warm/20 text-warm border-warm/30"
      : profileData.subscription.status === "paused"
      ? "bg-chart-4/15 text-chart-4 border-chart-4/30"
      : "bg-destructive/10 text-destructive border-destructive/30"

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {statusNote && (
          <div className="mb-4 rounded-lg border border-border/40 bg-muted/20 p-3 text-sm text-muted-foreground">
            {statusNote}
          </div>
        )}

        {/* Profile Header */}
        <section className="mb-10">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <div className="h-32 bg-linear-to-r from-primary/20 via-warm/10 to-accent/20" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16">
                <Avatar className="h-28 w-28 ring-4 ring-card shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileData.profile.avatarSeed || "medisyn")}`} alt={fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {(profileData.profile.firstName?.[0] ?? "U") + (profileData.profile.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 sm:pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                        <Input
                          value={draftProfile.firstName}
                          onChange={(event) => setDraftProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                          placeholder="First name"
                        />
                        <Input
                          value={draftProfile.lastName}
                          onChange={(event) => setDraftProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                          placeholder="Last name"
                        />
                      </div>
                    ) : (
                      <h1 className="text-2xl font-semibold text-foreground">{fullName}</h1>
                    )}
                    <Badge className="w-fit bg-warm/15 text-warm border-warm/30 hover:bg-warm/20">
                      <Zap className="h-3 w-3 mr-1" />
                      {profileData.subscription.plan.toUpperCase()} Plan
                    </Badge>
                  </div>
                  {isEditing ? (
                    <Input
                      className="mt-2 max-w-xl"
                      value={draftProfile.role}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, role: event.target.value }))}
                      placeholder="Role"
                    />
                  ) : (
                    <p className="text-muted-foreground mt-1">{profileData.profile.role || "Role not set"}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-4xl">
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            value={draftProfile.organization}
                            onChange={(event) => setDraftProfile((prev) => ({ ...prev, organization: event.target.value }))}
                            placeholder="Organization"
                          />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-10"
                            value={draftProfile.location}
                            onChange={(event) => setDraftProfile((prev) => ({ ...prev, location: event.target.value }))}
                            placeholder="Location"
                          />
                        </div>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pl-10"
                            value={draftProfile.memberSince || ""}
                            onChange={(event) => setDraftProfile((prev) => ({ ...prev, memberSince: event.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          {profileData.profile.organization || "Organization not set"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {profileData.profile.location || "Location not set"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {memberSinceText}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="sm:self-center flex items-center gap-2">
                  {isEditing && (
                    <Button disabled={isSaving} onClick={() => void handleSaveAccount()} className="shadow-sm hover:shadow transition-all duration-200">
                      {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  )}
                  <Button
                    disabled={isLoading || isSaving}
                    onClick={() => {
                      setIsEditing((value) => !value)
                      setDraftProfile(profileData.profile)
                    }}
                    className="shadow-sm hover:shadow transition-all duration-200"
                  >
                    {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {userStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.label} 
                className="border-border/40 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                      <p className="text-2xl font-semibold mt-1 text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-accent" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={draftProfile.firstName}
                      disabled={!isEditing || isSaving}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={draftProfile.lastName}
                      disabled={!isEditing || isSaving}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={draftProfile.email}
                      disabled={!isEditing || isSaving}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, email: event.target.value }))}
                      className="pl-10 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="organization"
                      value={draftProfile.organization}
                      disabled={!isEditing || isSaving}
                      onChange={(event) => setDraftProfile((prev) => ({ ...prev, organization: event.target.value }))}
                      className="pl-10 rounded-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={draftProfile.role}
                    disabled={!isEditing || isSaving}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, role: event.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={draftProfile.location}
                    disabled={!isEditing || isSaving}
                    onChange={(event) => setDraftProfile((prev) => ({ ...prev, location: event.target.value }))}
                    className="rounded-lg"
                  />
                </div>
                <Button disabled={!isEditing || isSaving} onClick={() => void handleSaveAccount()} className="shadow-sm hover:shadow transition-all duration-200">
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Manage how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "aiInsightAlerts", title: "AI Insight Alerts", description: "Get notified when new AI insights are generated" },
                  { key: "treatmentUpdates", title: "Treatment Updates", description: "Updates on treatments you're tracking" },
                  { key: "weeklyDigest", title: "Weekly Digest", description: "Weekly summary of analytics and trends" },
                  { key: "securityAlerts", title: "Security Alerts", description: "Important security and account notifications" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={profileData.notifications[item.key as keyof ProfileSettings["notifications"]]}
                      onCheckedChange={(checked) => {
                        setProfileData((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            [item.key]: checked,
                          },
                        }))
                      }}
                    />
                  </div>
                ))}
                <Button disabled={isSaving} onClick={() => void handleSaveNotifications()} className="shadow-sm hover:shadow transition-all duration-200">
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/40">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={profileData.security.twoFactorEnabled ? "bg-accent/15 text-accent border-accent/30" : "bg-muted text-muted-foreground"}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {profileData.security.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={profileData.security.twoFactorEnabled}
                      onCheckedChange={(value) => {
                        void toggleTwoFactor(value)
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed {formatRelativeTime(profileData.security.passwordUpdatedAt)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void simulatePasswordChange()}>
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <div className="h-2 bg-linear-to-r from-primary via-warm to-accent" />
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-warm/10 border border-warm/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-foreground">{profileData.subscription.plan.toUpperCase()} Plan</span>
                    <Badge className={statusBadgeClass}>{profileData.subscription.status.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Unlimited analyses, priority AI insights, and advanced reporting</p>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <div className="space-y-1">
                      <Label>Plan</Label>
                      <Select
                        value={draftSubscription.plan}
                        onValueChange={(value) => setDraftSubscription((prev) => ({ ...prev, plan: value as SubscriptionPlan }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Billing Period</Label>
                      <Select
                        value={draftSubscription.billingPeriod}
                        onValueChange={(value) => setDraftSubscription((prev) => ({ ...prev, billingPeriod: value as BillingPeriod }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Auto Renew</span>
                      <Switch
                        checked={draftSubscription.autoRenew}
                        onCheckedChange={(checked) => setDraftSubscription((prev) => ({ ...prev, autoRenew: checked }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing Period</span>
                      <span className="font-medium text-foreground">{profileData.subscription.billingPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Billing</span>
                      <span className="font-medium text-foreground">{profileData.subscription.nextBillingDate || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium text-foreground">
                        {profileData.subscription.currency} {profileData.subscription.amount}/{profileData.subscription.billingPeriod === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="w-full rounded-lg" disabled={isSaving} onClick={() => void handleSubscriptionSave()}>
                    {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Manage Subscription"}
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => void toggleSubscriptionStatus("active")}>Activate</Button>
                    <Button variant="outline" size="sm" onClick={() => void toggleSubscriptionStatus("paused")}>Pause</Button>
                    <Button variant="outline" size="sm" onClick={() => void toggleSubscriptionStatus("canceled")}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 group">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${getActivityIconClass(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{activity.action}</span>
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{activity.target}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(activity.time)}</p>
                      </div>
                    </div>
                  ))}
                  {profileData.recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
