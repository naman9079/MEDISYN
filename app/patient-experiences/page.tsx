"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { medisynSearchSuggestionId } from "@/lib/search-suggestions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Shield,
  Clock,
  AlertTriangle,
  Heart,
  TrendingUp,
  Filter,
  CheckCircle,
  Sparkles,
  Activity,
  Pill,
  CircleDashed,
  ArrowUpDown,
  BookOpenText,
  MessageCircleHeart,
  ShieldCheck,
  ShieldAlert,
  Radio
} from "lucide-react"

type FilterType = "all" | "side-effects" | "recovery" | "outcome"

type ExperienceSentiment = "positive" | "neutral" | "negative"

type PatientExperience = {
  id: number | string
  author: string
  initials: string
  treatment: string
  condition: string
  date: string
  content: string
  tags: string[]
  sentiment: ExperienceSentiment
  credibilityScore: number
  likes: number
  replies: number
  verified: boolean
  sourceUrl?: string
}

type SortType = "recent" | "popular" | "credibility"

const experiences: PatientExperience[] = []

const tagColors: Record<string, string> = {
  "Side Effects": "bg-destructive/10 text-destructive border-destructive/20",
  "Recovery": "bg-accent/10 text-accent border-accent/20",
  "Outcome": "bg-primary/10 text-primary border-primary/20"
}

const sentimentStyles: Record<ExperienceSentiment, string> = {
  positive: "bg-accent/10 text-accent border-accent/30",
  neutral: "bg-muted text-muted-foreground border-border",
  negative: "bg-destructive/10 text-destructive border-destructive/30",
}

const sentimentLabels: Record<ExperienceSentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Challenging",
}

function getSourceDomain(sourceUrl?: string) {
  if (!sourceUrl) {
    return "Unknown source"
  }

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "")
    return hostname
  } catch {
    return "Unknown source"
  }
}

function getCredibilityBand(score: number) {
  if (score >= 90) {
    return { label: "High confidence", Icon: ShieldCheck, className: "text-accent" }
  }

  if (score >= 80) {
    return { label: "Moderate confidence", Icon: Shield, className: "text-primary" }
  }

  return { label: "Low confidence", Icon: ShieldAlert, className: "text-destructive" }
}

function getCardAccent(tags: string[]) {
  if (tags.includes("Side Effects")) {
    return "border-l-destructive/50"
  }

  if (tags.includes("Recovery")) {
    return "border-l-accent/50"
  }

  return "border-l-primary/50"
}

export default function PatientExperiencesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortType>("recent")
  const [experiencesData, setExperiencesData] = useState<PatientExperience[]>(experiences)
  const [dataSource, setDataSource] = useState<"loading" | "realtime-db" | "real-file" | "fallback" | "local">("loading")
  const [dataNote, setDataNote] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle")

  useEffect(() => {
    let isMounted = true
    let syncInterval: ReturnType<typeof setInterval> | null = null

    async function loadRealData() {
      try {
        const response = await fetch("/api/data/patient-experiences?sourceType=reddit", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to load patient experiences")
        }

        const payload = (await response.json()) as {
          source?: "realtime-db" | "real-file" | "fallback"
          note?: string
          items?: PatientExperience[]
        }

        if (!isMounted) {
          return
        }

        if (Array.isArray(payload.items) && payload.items.length > 0) {
          setExperiencesData(payload.items)
          setDataSource(payload.source ?? "fallback")
          setDataNote(payload.note ?? null)
          setLastUpdated(new Date().toLocaleTimeString())
          return
        }

        setDataSource("fallback")
        setDataNote("No records were returned by the API. Add your own disease records to get started.")
      } catch {
        if (!isMounted) {
          return
        }

        setDataSource("local")
        setDataNote("Unable to read real data API. No local disease samples are configured.")
      }
    }

    async function syncRedditAndRefresh() {
      try {
        if (!isMounted) {
          return
        }

        setSyncState("syncing")

        const syncResponse = await fetch("/api/data/collect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preset: "reddit-only" }),
        })

        if (!syncResponse.ok) {
          const payload = (await syncResponse.json().catch(() => null)) as { error?: string } | null
          if (isMounted) {
            setDataNote(payload?.error ?? "No data sources configured. Add your own source first.")
            setSyncState("idle")
          }
          return
        }

        await loadRealData()
        if (isMounted) {
          setSyncState("idle")
        }
      } catch {
        if (isMounted) {
          setSyncState("error")
          setDataNote("Live Reddit sync failed. Showing latest available records.")
        }
      }
    }

    void loadRealData()
    void syncRedditAndRefresh()
    syncInterval = setInterval(() => {
      void syncRedditAndRefresh()
    }, 60000)

    return () => {
      isMounted = false
      if (syncInterval) {
        clearInterval(syncInterval)
      }
    }
  }, [])

  const filteredExperiences = experiencesData.filter((exp) => {
    const matchesFilter = activeFilter === "all" || 
      exp.tags.some(tag => tag.toLowerCase().replace(" ", "-") === activeFilter)
    const matchesSearch = searchQuery === "" || 
      exp.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.treatment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const sortedExperiences = [...filteredExperiences].sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes + b.replies - (a.likes + a.replies)
    }

    if (sortBy === "credibility") {
      return b.credibilityScore - a.credibilityScore
    }

    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const total = experiencesData.length
  const verifiedCount = experiencesData.filter((item) => item.verified).length
  const averageCredibility = total > 0
    ? Math.round(experiencesData.reduce((sum, item) => sum + item.credibilityScore, 0) / total)
    : 0
  const distinctConditions = new Set(experiencesData.map((item) => item.condition.toLowerCase())).size

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Patient Experience Feed</h1>
          <p className="text-muted-foreground">Real patient discussions and treatment feedback</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="bg-background border-border text-muted-foreground">
              <Radio className="h-3.5 w-3.5 mr-1 text-primary" />
              Reddit Live {syncState === "syncing" ? "syncing..." : syncState === "error" ? "degraded" : "active"}
            </Badge>
            {lastUpdated && (
              <Badge variant="outline" className="bg-background border-border text-muted-foreground">
                Last updated: {lastUpdated}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Data source: {dataSource === "loading" ? "loading..." : dataSource}
          </p>
          {dataNote && <p className="text-xs text-muted-foreground mt-1">{dataNote}</p>}
        </div>

        <Card className="border border-primary/20 bg-linear-to-r from-primary/5 via-background to-accent/5 shadow-sm mb-6">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                How to read this feed quickly
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <CircleDashed className="h-4 w-4 text-destructive" />
                    Tags
                  </div>
                  <p className="text-xs text-muted-foreground">Side Effects = issues, Recovery = improvement, Outcome = treatment result.</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <MessageCircleHeart className="h-4 w-4 text-accent" />
                    Sentiment
                  </div>
                  <p className="text-xs text-muted-foreground">Positive, Neutral, or Challenging tone based on the patient narrative.</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    Confidence
                  </div>
                  <p className="text-xs text-muted-foreground">Score reflects source reliability and detail level, not medical certainty.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Total Experiences</span>
                <BookOpenText className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-semibold">{total}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Verified Sources</span>
                <CheckCircle className="h-4 w-4 text-accent" />
              </div>
              <p className="text-xl font-semibold">{verifiedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Avg Confidence</span>
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-semibold">{averageCredibility}%</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Conditions Covered</span>
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xl font-semibold">{distinctConditions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search experiences, treatments, or conditions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                list={medisynSearchSuggestionId}
              />
            </div>
            <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="credibility">Highest Credibility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              All
            </Button>
            <Button 
              variant={activeFilter === "side-effects" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("side-effects")}
              className={activeFilter === "side-effects" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Side Effects
            </Button>
            <Button 
              variant={activeFilter === "recovery" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("recovery")}
              className={activeFilter === "recovery" ? "bg-accent hover:bg-accent/90" : ""}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Recovery
            </Button>
            <Button 
              variant={activeFilter === "outcome" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("outcome")}
            >
              <Heart className="h-4 w-4 mr-1" />
              Outcome
            </Button>
          </div>
        </div>

        {/* Experience Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedExperiences.map((experience) => {
            const confidence = getCredibilityBand(experience.credibilityScore)
            const sourceDomain = getSourceDomain(experience.sourceUrl)

            return (
            <Card key={experience.id} className={`border-border/40 border-l-4 ${getCardAccent(experience.tags)} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {experience.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{experience.author}</span>
                        {experience.verified && (
                          <CheckCircle className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {experience.date}
                      </div>
                    </div>
                  </div>
                  
                  {/* Credibility Score */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10">
                    <confidence.Icon className={`h-3.5 w-3.5 ${confidence.className}`} />
                    <span className="text-sm font-medium text-accent">{experience.credibilityScore}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className={sentimentStyles[experience.sentiment]}>
                    {sentimentLabels[experience.sentiment]}
                  </Badge>
                  <Badge variant="outline" className="bg-background text-muted-foreground border-border">
                    {confidence.label}
                  </Badge>
                  <Badge variant="outline" className="bg-background text-muted-foreground border-border">
                    Source: {sourceDomain}
                  </Badge>
                </div>

                {/* Treatment Info */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="font-medium flex items-center gap-1">
                    <Pill className="h-3.5 w-3.5" />
                    {experience.treatment}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    <Activity className="h-3.5 w-3.5 mr-1" />
                    {experience.condition}
                  </Badge>
                </div>

                {/* Content */}
                <p className="text-sm text-foreground leading-relaxed mb-4 min-h-21">
                  {experience.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {experience.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline"
                      className={tagColors[tag]}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">{experience.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{experience.replies}</span>
                    </button>
                  </div>
                  {experience.sourceUrl ? (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" asChild>
                      <a href={experience.sourceUrl} target="_blank" rel="noreferrer noopener">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Source
                      </a>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Source Unavailable
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>

        {/* Load More */}
        {sortedExperiences.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" size="lg">
              Load More Experiences
            </Button>
          </div>
        )}

        {/* Empty State */}
        {sortedExperiences.length === 0 && (
          <Card className="border-border/40 shadow-sm">
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No experiences found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
