"use client"

import { useEffect, useMemo, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, Search, CreditCard, MessageCircle, Phone, Video } from "lucide-react"
import { medisynSearchSuggestionId } from "@/lib/search-suggestions"
import type { ConnectProPlan, MentorBooking, MentorPriceCard, MentorProfile, SessionType } from "@/lib/connect/types"

type MentorApiResponse = {
  ok: boolean
  mentors?: MentorProfile[]
  meta?: {
    totalMentors: number
    medicalDisclaimer: string
    platformCommissionRate: number
    proPlan: ConnectProPlan
  }
  error?: string
}

type BookingApiResponse = {
  ok: boolean
  booking?: MentorBooking
  emailDelivery?: {
    sent: boolean
    message: string
  }
  error?: string
}

const sessionTypeLabels: Record<SessionType, string> = {
  chat: "Chat",
  audio: "Audio Call",
  video: "Video Session",
}

const sessionTypeIcons: Record<SessionType, typeof MessageCircle> = {
  chat: MessageCircle,
  audio: Phone,
  video: Video,
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return "Not scheduled"
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getPriceFor(mentor: MentorProfile, sessionType: SessionType): MentorPriceCard | null {
  return mentor.sessionPrices.find((item) => item.sessionType === sessionType) ?? null
}

export default function MedisynConnectPage() {
  const [diseaseQuery, setDiseaseQuery] = useState("")
  const [sessionFilter, setSessionFilter] = useState<"all" | SessionType>("all")
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [meta, setMeta] = useState<MentorApiResponse["meta"] | null>(null)
  const [loadingMentors, setLoadingMentors] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [selectedMentorId, setSelectedMentorId] = useState("")
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("namanshukla328@gmail.com")
  const [patientDisease, setPatientDisease] = useState("")
  const [bookingSessionType, setBookingSessionType] = useState<SessionType>("chat")
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "razorpay">("stripe")
  const [scheduledAt, setScheduledAt] = useState("")
  const [activeBookingMentorId, setActiveBookingMentorId] = useState<string | null>(null)

  const [bookingStatus, setBookingStatus] = useState<string | null>(null)

  async function loadMentors() {
    try {
      setLoadingMentors(true)
      setErrorMessage(null)

      const params = new URLSearchParams()
      if (diseaseQuery.trim()) {
        params.set("disease", diseaseQuery.trim())
      }
      if (sessionFilter !== "all") {
        params.set("sessionType", sessionFilter)
      }

      const response = await fetch(`/api/connect/mentors?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as MentorApiResponse
      if (!response.ok || !payload.ok || !payload.mentors || !payload.meta) {
        throw new Error(payload.error ?? "Failed to load mentors")
      }

      const mentorList = payload.mentors

      setMentors(mentorList)
      setMeta(payload.meta)

      if (mentorList.length > 0) {
        setSelectedMentorId((current) => current || mentorList[0].id)
        setActiveBookingMentorId((current) => current || mentorList[0].id)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load mentors")
    } finally {
      setLoadingMentors(false)
    }
  }

  useEffect(() => {
    void loadMentors()
  }, [])

  async function handleBookSession(event: React.FormEvent<HTMLFormElement>, mentorIdOverride?: string) {
    event.preventDefault()

    setBookingStatus("Processing payment and booking session...")

    const bookingMentorId = mentorIdOverride ?? selectedMentorId
    const bookingMentor = mentors.find((item) => item.id === bookingMentorId)
    const bookingPrice = bookingMentor ? getPriceFor(bookingMentor, bookingSessionType) : null
    const durationMinutes = bookingPrice?.durationMinutes ?? 20

    const response = await fetch("/api/connect/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mentorId: bookingMentorId,
        patientName,
        patientEmail,
        disease: patientDisease,
        sessionType: bookingSessionType,
        durationMinutes,
        paymentProvider,
        scheduledAt,
      }),
    })

    const payload = (await response.json()) as BookingApiResponse

    if (!response.ok || !payload.ok || !payload.booking) {
      setBookingStatus(payload.error ?? "Failed to book session")
      return
    }

    const bookingMessage = `Session booked with payment confirmed: ${sessionTypeLabels[payload.booking.sessionType]} on ${formatDateTime(payload.booking.scheduledAt)} for ${formatCurrency(payload.booking.amountUsd)}.`
    const emailMessage = payload.emailDelivery
      ? payload.emailDelivery.sent
        ? ` ${payload.emailDelivery.message}`
        : ` Email not sent yet: ${payload.emailDelivery.message}`
      : ""

    setBookingStatus(`${bookingMessage}${emailMessage}`)

    setPatientName("")
    setPatientEmail("")
    setPatientDisease("")
    setScheduledAt("")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-24 top-56 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <Navigation />

      <main className="container relative z-10 mx-auto px-4 py-8">
        <section className="mb-8 rounded-3xl border border-primary/25 bg-linear-to-r from-cyan-500/15 via-background to-emerald-500/15 p-6 shadow-xl shadow-cyan-900/5 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="mb-3 border border-primary/30 bg-primary/15 text-primary">Medisyn Connect</Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Paid Peer Mentorship For Real Recovery Journeys</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Explore verified mentors by disease, book chat/audio/video sessions, and learn from lived recovery experiences.
                Mentors share personal stories, not medical advice.
              </p>
            </div>
            {meta?.proPlan ? (
              <Card className="w-full max-w-md border-primary/20 bg-card/90 shadow-lg shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle>{meta.proPlan.planName}</CardTitle>
                  <CardDescription>{formatCurrency(meta.proPlan.monthlyUsd)}/month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {meta.proPlan.benefits.map((benefit) => (
                    <p key={benefit}>• {benefit}</p>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>

        <Alert className="mb-8 rounded-2xl border-amber-500/40 bg-amber-50/75 text-amber-950 shadow-sm dark:bg-amber-950/20 dark:text-amber-100">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Safety & Compliance</AlertTitle>
          <AlertDescription>
            {meta?.medicalDisclaimer ?? "Mentors share personal recovery experiences only. No diagnosis or medical prescriptions are allowed."}
          </AlertDescription>
        </Alert>

        <section className="mb-8 grid gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm md:grid-cols-[1fr_220px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={diseaseQuery}
              onChange={(event) => setDiseaseQuery(event.target.value)}
              list={medisynSearchSuggestionId}
              placeholder="Search disease (e.g., cancer, diabetes, diarrhea, asthma)"
              className="border-border/70 bg-background/80 pl-9"
            />
          </div>
          <Select value={sessionFilter} onValueChange={(value) => setSessionFilter(value as typeof sessionFilter)}>
            <SelectTrigger className="w-full border-border/70 bg-background/80">
              <SelectValue placeholder="Session format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All session types</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="audio">Audio Call</SelectItem>
              <SelectItem value="video">Video Session</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void loadMentors()} disabled={loadingMentors} className="bg-primary text-primary-foreground shadow-md shadow-primary/20">
            {loadingMentors ? "Searching..." : "Find Mentors"}
          </Button>
        </section>

        {errorMessage ? (
          <p className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <section className="mb-10 grid gap-6 lg:grid-cols-3">
          {mentors.map((mentor) => {
            const chatPrice = getPriceFor(mentor, "chat")
            const audioPrice = getPriceFor(mentor, "audio")
            const videoPrice = getPriceFor(mentor, "video")
            const bookingPrice = getPriceFor(mentor, bookingSessionType)
            const isBookingOpen = activeBookingMentorId === mentor.id
            const ChatIcon = sessionTypeIcons.chat
            const AudioIcon = sessionTypeIcons.audio
            const VideoIcon = sessionTypeIcons.video

            return (
              <Card key={mentor.id} className="rounded-2xl border-border/70 bg-card/90 shadow-md shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/10">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {mentor.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{mentor.name}</CardTitle>
                        <CardDescription>
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {mentor.diseaseRecoveredFrom}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    {mentor.verified ? <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{mentor.experienceSummary}</p>
                  <p><span className="font-medium">Treatment used:</span> {mentor.treatmentUsed}</p>
                  <p><span className="font-medium">Recovery duration:</span> {mentor.recoveryDuration}</p>
                  <p><span className="font-medium">Languages:</span> {mentor.language}</p>
                  <p><span className="font-medium">Rating:</span> {mentor.averageRating.toFixed(1)} / 5 ({mentor.reviewCount} reviews)</p>

                  <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Session prices</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2 py-2">
                        <ChatIcon className="mx-auto mb-1 h-4 w-4 text-cyan-600" />
                        <p className="font-medium">Chat</p>
                        <p>{chatPrice ? formatCurrency(chatPrice.priceUsd) : "-"}</p>
                        <p className="text-muted-foreground">20 min</p>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2 py-2">
                        <AudioIcon className="mx-auto mb-1 h-4 w-4 text-emerald-600" />
                        <p className="font-medium">Audio</p>
                        <p>{audioPrice ? formatCurrency(audioPrice.priceUsd) : "-"}</p>
                        <p className="text-muted-foreground">40 min</p>
                      </div>
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2 py-2">
                        <VideoIcon className="mx-auto mb-1 h-4 w-4 text-violet-600" />
                        <p className="font-medium">Video</p>
                        <p>{videoPrice ? formatCurrency(videoPrice.priceUsd) : "-"}</p>
                        <p className="text-muted-foreground">60 min</p>
                      </div>
                    </div>
                  </div>

                  <p className="rounded-xl border border-amber-500/30 bg-amber-50/70 px-2 py-2 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                    {mentor.disclaimer}
                  </p>

                  <div className="pt-2">
                    <Button
                      type="button"
                      className="w-full bg-linear-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-900/20 hover:from-cyan-500 hover:to-emerald-500"
                      onClick={() => {
                        setSelectedMentorId(mentor.id)
                        setActiveBookingMentorId((current) => (current === mentor.id ? null : mentor.id))
                        setBookingStatus(null)
                      }}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {isBookingOpen ? "Hide Booking" : `Book ${mentor.name.split(" ")[0]}`}
                    </Button>
                  </div>

                  {isBookingOpen ? (
                    <form className="mt-3 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3" onSubmit={(event) => void handleBookSession(event, mentor.id)}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input placeholder="Your name" value={patientName} onChange={(event) => setPatientName(event.target.value)} className="border-border/70 bg-background/85" />
                        <Input placeholder="Your email" value={patientEmail} onChange={(event) => setPatientEmail(event.target.value)} className="border-border/70 bg-background/85" />
                      </div>

                      <Input
                        placeholder="Disease you want support for"
                        value={patientDisease}
                        onChange={(event) => setPatientDisease(event.target.value)}
                        className="border-border/70 bg-background/85"
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        <Select value={bookingSessionType} onValueChange={(value) => setBookingSessionType(value as SessionType)}>
                          <SelectTrigger className="w-full border-border/70 bg-background/85">
                            <SelectValue placeholder="Session type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chat">Chat (20 min)</SelectItem>
                            <SelectItem value="audio">Audio Call (40 min)</SelectItem>
                            <SelectItem value="video">Video Session (60 min)</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={paymentProvider} onValueChange={(value) => setPaymentProvider(value as "stripe" | "razorpay")}>
                          <SelectTrigger className="w-full border-border/70 bg-background/85">
                            <SelectValue placeholder="Payment provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="razorpay">Razorpay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(event) => setScheduledAt(event.target.value)}
                        className="border-border/70 bg-background/85"
                      />

                      <div className="rounded-xl border border-primary/20 bg-background/70 px-3 py-2 text-sm">
                        <p className="font-medium">Estimated session price</p>
                        <p className="text-muted-foreground">
                          {bookingPrice
                            ? `${sessionTypeLabels[bookingPrice.sessionType]} · ${bookingPrice.durationMinutes} min · ${formatCurrency(bookingPrice.priceUsd)}`
                            : "Choose a session type"}
                        </p>
                      </div>

                      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <CreditCard className="mr-2 h-4 w-4" /> Pay And Book Session
                      </Button>

                      {bookingStatus ? <p className="text-xs text-muted-foreground">{bookingStatus}</p> : null}
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </section>
      </main>
    </div>
  )
}
