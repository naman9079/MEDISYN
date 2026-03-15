"use client"

import { useEffect, useMemo, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, Star, Search, CalendarCheck2, CreditCard, MessageCircle, Phone, Video } from "lucide-react"
import type { ConnectProPlan, MentorBooking, MentorPriceCard, MentorProfile, MentorReview, SessionType } from "@/lib/connect/types"

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

type ReviewsApiResponse = {
  ok: boolean
  reviews?: MentorReview[]
  error?: string
}

type BookingApiResponse = {
  ok: boolean
  booking?: MentorBooking
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
  const [reviews, setReviews] = useState<MentorReview[]>([])
  const [loadingMentors, setLoadingMentors] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [selectedMentorId, setSelectedMentorId] = useState("")
  const [patientName, setPatientName] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [patientDisease, setPatientDisease] = useState("")
  const [bookingSessionType, setBookingSessionType] = useState<SessionType>("chat")
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "razorpay">("stripe")
  const [scheduledAt, setScheduledAt] = useState("")

  const [reviewMentorId, setReviewMentorId] = useState("")
  const [reviewPatientName, setReviewPatientName] = useState("")
  const [reviewRating, setReviewRating] = useState("5")
  const [reviewComment, setReviewComment] = useState("")

  const [bookingStatus, setBookingStatus] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<string | null>(null)

  const selectedMentor = useMemo(() => mentors.find((item) => item.id === selectedMentorId) ?? null, [mentors, selectedMentorId])
  const selectedReviewMentor = useMemo(
    () => mentors.find((item) => item.id === reviewMentorId) ?? null,
    [mentors, reviewMentorId],
  )

  const selectedMentorPrice = useMemo(() => {
    if (!selectedMentor) {
      return null
    }

    return getPriceFor(selectedMentor, bookingSessionType)
  }, [selectedMentor, bookingSessionType])

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

      setMentors(payload.mentors)
      setMeta(payload.meta)

      if (payload.mentors.length > 0) {
        setSelectedMentorId((current) => current || payload.mentors[0].id)
        setReviewMentorId((current) => current || payload.mentors[0].id)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load mentors")
    } finally {
      setLoadingMentors(false)
    }
  }

  async function loadReviews() {
    try {
      const response = await fetch("/api/connect/reviews?limit=100", {
        method: "GET",
        cache: "no-store",
      })

      const payload = (await response.json()) as ReviewsApiResponse

      if (!response.ok || !payload.ok || !payload.reviews) {
        throw new Error(payload.error ?? "Failed to load reviews")
      }

      setReviews(payload.reviews)
    } catch {
      // Keep reviews blank when API is temporarily unavailable.
      setReviews([])
    }
  }

  useEffect(() => {
    void loadMentors()
    void loadReviews()
  }, [])

  async function handleBookSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setBookingStatus("Processing payment and booking session...")

    const durationMinutes = selectedMentorPrice?.durationMinutes ?? 20

    const response = await fetch("/api/connect/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mentorId: selectedMentorId,
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

    setBookingStatus(
      `Session booked with payment confirmed: ${sessionTypeLabels[payload.booking.sessionType]} on ${formatDateTime(payload.booking.scheduledAt)} for ${formatCurrency(payload.booking.amountUsd)}.`,
    )

    setPatientName("")
    setPatientEmail("")
    setPatientDisease("")
    setScheduledAt("")
  }

  async function handleSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setReviewStatus("Submitting review...")

    const response = await fetch("/api/connect/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mentorId: reviewMentorId,
        patientName: reviewPatientName,
        rating: Number(reviewRating),
        comment: reviewComment,
      }),
    })

    const payload = (await response.json()) as { ok: boolean; error?: string }

    if (!response.ok || !payload.ok) {
      setReviewStatus(payload.error ?? "Failed to submit review")
      return
    }

    setReviewStatus("Thank you, your review was submitted.")
    setReviewPatientName("")
    setReviewRating("5")
    setReviewComment("")
    await loadMentors()
    await loadReviews()
  }

  const topReviews = useMemo(() => {
    return reviews
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 6)
  }, [reviews])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <section className="mb-8 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-background to-accent/10 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="mb-3 bg-primary/15 text-primary">Medisyn Connect</Badge>
              <h1 className="text-3xl font-semibold text-foreground">Paid Peer Mentorship For Real Recovery Journeys</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Explore verified mentors by disease, book chat/audio/video sessions, and learn from lived recovery experiences.
                Mentors share personal stories, not medical advice.
              </p>
            </div>
            {meta?.proPlan ? (
              <Card className="w-full max-w-md border-primary/20 bg-card/80">
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

        <Alert className="mb-8 border-amber-500/30 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Safety & Compliance</AlertTitle>
          <AlertDescription>
            {meta?.medicalDisclaimer ?? "Mentors share personal recovery experiences only. No diagnosis or medical prescriptions are allowed."}
          </AlertDescription>
        </Alert>

        <section className="mb-8 grid gap-4 md:grid-cols-[1fr_220px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={diseaseQuery}
              onChange={(event) => setDiseaseQuery(event.target.value)}
              placeholder="Search disease (e.g., breast cancer, lymphoma, Crohn's)"
              className="pl-9"
            />
          </div>
          <Select value={sessionFilter} onValueChange={(value) => setSessionFilter(value as typeof sessionFilter)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Session format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All session types</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="audio">Audio Call</SelectItem>
              <SelectItem value="video">Video Session</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void loadMentors()} disabled={loadingMentors}>
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

            return (
              <Card key={mentor.id} className="border-border/80">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">{mentor.name}</CardTitle>
                      <CardDescription>{mentor.diseaseRecoveredFrom}</CardDescription>
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

                  <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Session prices</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-background px-2 py-2">
                        <p className="font-medium">Chat</p>
                        <p>{chatPrice ? formatCurrency(chatPrice.priceUsd) : "-"}</p>
                        <p className="text-muted-foreground">20 min</p>
                      </div>
                      <div className="rounded-md bg-background px-2 py-2">
                        <p className="font-medium">Audio</p>
                        <p>{audioPrice ? formatCurrency(audioPrice.priceUsd) : "-"}</p>
                        <p className="text-muted-foreground">40 min</p>
                      </div>
                      <div className="rounded-md bg-background px-2 py-2">
                        <p className="font-medium">Video</p>
                        <p>{videoPrice ? formatCurrency(videoPrice.priceUsd) : "-"}</p>
                        <p className="text-muted-foreground">60 min</p>
                      </div>
                    </div>
                  </div>

                  <p className="rounded-md border border-amber-500/30 bg-amber-50/70 px-2 py-2 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                    {mentor.disclaimer}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="mb-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4" /> Book A Paid Session</CardTitle>
              <CardDescription>Payment processing is currently simulated. Replace with Stripe or Razorpay checkout in production.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={(event) => void handleBookSession(event)}>
                <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>{mentor.name} - {mentor.diseaseRecoveredFrom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Your name" value={patientName} onChange={(event) => setPatientName(event.target.value)} />
                  <Input placeholder="Your email" value={patientEmail} onChange={(event) => setPatientEmail(event.target.value)} />
                </div>

                <Input
                  placeholder="Disease you want support for"
                  value={patientDisease}
                  onChange={(event) => setPatientDisease(event.target.value)}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <Select value={bookingSessionType} onValueChange={(value) => setBookingSessionType(value as SessionType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat (20 min)</SelectItem>
                      <SelectItem value="audio">Audio Call (40 min)</SelectItem>
                      <SelectItem value="video">Video Session (60 min)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={paymentProvider} onValueChange={(value) => setPaymentProvider(value as "stripe" | "razorpay")}>
                    <SelectTrigger className="w-full">
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
                />

                <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                  <p className="font-medium">Estimated session price</p>
                  <p className="text-muted-foreground">
                    {selectedMentorPrice
                      ? `${sessionTypeLabels[selectedMentorPrice.sessionType]} · ${selectedMentorPrice.durationMinutes} min · ${formatCurrency(selectedMentorPrice.priceUsd)}`
                      : "Choose a mentor and session type"}
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" /> Pay And Book Session
                </Button>

                {bookingStatus ? <p className="text-sm text-muted-foreground">{bookingStatus}</p> : null}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rate Your Session</CardTitle>
              <CardDescription>Patient feedback improves mentor matching and quality.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={(event) => void handleSubmitReview(event)}>
                <Select value={reviewMentorId} onValueChange={setReviewMentorId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>{mentor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedReviewMentor ? (
                  <p className="text-xs text-muted-foreground">Reviewing: {selectedReviewMentor.diseaseRecoveredFrom}</p>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Your name"
                    value={reviewPatientName}
                    onChange={(event) => setReviewPatientName(event.target.value)}
                  />
                  <Select value={reviewRating} onValueChange={setReviewRating}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="2">2 - Fair</SelectItem>
                      <SelectItem value="1">1 - Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  placeholder="Share what was most helpful in the mentorship session"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                />

                <Button type="submit" className="w-full">
                  <Star className="mr-2 h-4 w-4" /> Submit Review
                </Button>

                {reviewStatus ? <p className="text-sm text-muted-foreground">{reviewStatus}</p> : null}
              </form>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Mentor Reviews</h2>
            <p className="text-sm text-muted-foreground">{meta?.totalMentors ?? mentors.length} verified mentors listed</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topReviews.map((review) => {
              const mentor = mentors.find((item) => item.id === review.mentorId)
              return (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{review.patientName}</CardTitle>
                    <CardDescription>{mentor?.name ?? "Mentor"} · {formatDateTime(review.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-amber-600">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
